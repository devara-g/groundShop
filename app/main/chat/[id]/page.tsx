import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ChatMessages from "./ChatMessages"
import MessageInput from "./MessageInput"
import Link from "next/link"

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

export default async function ChatRoomPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Fetch conversation
  const { data: convo } = await supabase
    .from("conversations")
    .select(`
      id, participant_1, participant_2,
      p1:participant_1(id, username, avatar_url),
      p2:participant_2(id, username, avatar_url)
    `)
    .eq("id", params.id)
    .single()

  if (!convo) redirect("/main/chat")

  const norm = (p: any) => Array.isArray(p) ? p[0] ?? null : p
  const p1 = norm(convo.p1)
  const p2 = norm(convo.p2)
  const other = convo.participant_1 === user.id ? p2 : p1

  // Fetch last 60 messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, is_read, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true })
    .limit(60)

  // Mark incoming messages as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", params.id)
    .neq("sender_id", user.id)
    .eq("is_read", false)

  return (
    <div className="flex flex-col h-full bg-slate-50 md:rounded-3xl overflow-hidden w-full relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20">
        <Link href="/main/chat" className="text-slate-400 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-full hover:bg-blue-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="relative">
          {other?.avatar_url ? (
            <img
              src={other.avatar_url}
              alt={other.username}
              className="w-12 h-12 rounded-2xl object-cover shadow-inner relative"
            />
          ) : (
            <div className={`w-12 h-12 ${getColor(other?.username || "a")} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner relative`}>
              {other?.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">{other?.username || "Unknown"}</p>
          <p className="text-xs font-bold text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages
        conversationId={params.id}
        initialMessages={messages || []}
        currentUserId={user.id}
      />

      {/* Input */}
      <MessageInput conversationId={params.id} currentUserId={user.id} />
    </div>
  )
}
