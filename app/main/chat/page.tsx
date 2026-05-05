import { createServerSupabase } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "Baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

function formatMessagePreview(content: string) {
  let text = content.replace(/^\[reply:.+?\]\n?/g, "")
  const hasImage = text.match(/^\[image:.+?\]/)
  text = text.replace(/^\[image:.+?\]\n?/g, "").trim()
  
  if (hasImage && !text) return "📷 Mengirim gambar"
  if (hasImage && text) return `📷 ${text}`
  return text || "Pesan"
}

export default async function ChatPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Fetch conversations with last message and unread count
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id, created_at,
      participant_1, participant_2,
      p1:participant_1(id, username, avatar_url),
      p2:participant_2(id, username, avatar_url),
      messages(id, content, sender_id, is_read, created_at)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("created_at", { referencedTable: "messages", ascending: false })

  const norm = (p: any) => Array.isArray(p) ? p[0] ?? null : p

  const convos = (conversations || []).map((c) => {
    const p1 = norm(c.p1)
    const p2 = norm(c.p2)
    const other = c.participant_1 === user.id ? p2 : p1
    const msgs = (c.messages as any[]) || []
    const lastMsg = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    const unread = msgs.filter((m) => !m.is_read && m.sender_id !== user.id).length
    return { ...c, other, lastMsg, unread }
  }).sort((a, b) => {
    const ta = a.lastMsg?.created_at || a.created_at
    const tb = b.lastMsg?.created_at || b.created_at
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  return (
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pesan</h1>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
        {convos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada obrolan</h2>
            <p className="text-slate-500">Mulai kirim pesan ke temanmu lewat halaman Teman.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4 md:p-0">
            {convos.map((c) => (
              <Link key={c.id} href={`/main/chat/${c.id}`}
                className="flex items-center gap-4 px-6 py-4 bg-white hover:bg-slate-50 transition-colors group">
                
                {/* Avatar */}
                <div className="relative shrink-0">
                  {c.other?.avatar_url ? (
                    <img
                      src={c.other.avatar_url}
                      alt={c.other.username}
                      className="w-14 h-14 rounded-2xl object-cover shadow-inner"
                    />
                  ) : (
                    <div className={`w-14 h-14 ${getColor(c.other?.username || "a")} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner`}>
                      {c.other?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  {c.unread > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md shadow-red-500/30 border-2 border-white">
                      {c.unread > 9 ? "9+" : c.unread}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.other?.username || "Unknown"}</p>
                    {c.lastMsg && (
                      <p className="text-xs font-medium text-slate-400 shrink-0 ml-2">{timeAgo(c.lastMsg.created_at)}</p>
                    )}
                  </div>
                  <p className={`text-sm truncate ${c.unread > 0 ? "font-bold text-slate-800" : "text-slate-500"}`}>
                    {c.lastMsg
                      ? (c.lastMsg.sender_id === user.id ? `Kamu: ${formatMessagePreview(c.lastMsg.content)}` : formatMessagePreview(c.lastMsg.content))
                      : "Mulai percakapan..."}
                  </p>
                </div>

                {/* Double check mark */}
                {c.lastMsg?.sender_id === user.id && (
                  <span className={`text-xs shrink-0 font-bold ${c.lastMsg.is_read ? "text-blue-500" : "text-slate-300"}`}>✓✓</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
