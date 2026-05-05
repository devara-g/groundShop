import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "Baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

  type NotificationItem = {
    id: string
    type: string
    title: string
    content: string
    user: { username: string; avatar_url: string | null }
    link: string
    created_at: string
    icon: string
    color: string
  }

  const notifications: NotificationItem[] = []

  // 1. Friend Requests
  const { data: requests } = await supabase
    .from("friendships")
    .select("created_at, status, profiles:requester_id(id, username, avatar_url)")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (requests) {
    requests.forEach(req => {
      const p = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles
      if (p) {
        notifications.push({
          id: `req_${p.id}`,
          type: "friend_request",
          title: "Permintaan Pertemanan",
          content: `${p.username} mengirimkan permintaan pertemanan.`,
          user: p,
          link: `/main/u/${encodeURIComponent(p.username)}`,
          created_at: req.created_at,
          icon: "👥",
          color: "bg-purple-100 text-purple-600"
        })
      }
    })
  }

  // 2. Mentions
  if (profile?.username) {
    const { data: mentions } = await supabase
      .from("posts")
      .select("id, content, created_at, profiles:user_id(id, username, avatar_url)")
      .ilike("content", `%@[${profile.username}]%`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (mentions) {
      mentions.forEach(post => {
        const p = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        if (p && p.id !== user.id) {
          notifications.push({
            id: `mention_${post.id}`,
            type: "mention",
            title: "Menyebut Anda",
            content: `${p.username} menyebut Anda dalam sebuah postingan.`,
            user: p,
            link: `/main/feed`, // Idealnya ke post detail, tapi feed cukup
            created_at: post.created_at,
            icon: "📢",
            color: "bg-blue-100 text-blue-600"
          })
        }
      })
    }
  }

  // 3. Unread Messages
  const { data: convos } = await supabase
    .from("conversations")
    .select(`
      id,
      participant_1, participant_2,
      p1:participant_1(id, username, avatar_url),
      p2:participant_2(id, username, avatar_url),
      messages!inner(id, content, sender_id, is_read, created_at)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .eq("messages.is_read", false)
    .neq("messages.sender_id", user.id)

  if (convos) {
    convos.forEach(c => {
      const p1 = Array.isArray(c.p1) ? c.p1[0] : c.p1
      const p2 = Array.isArray(c.p2) ? c.p2[0] : c.p2
      const other = c.participant_1 === user.id ? p2 : p1
      const msgs = Array.isArray(c.messages) ? c.messages : []
      if (other && msgs.length > 0) {
        // Ambil pesan terbaru untuk ambil tanggal
        const lastMsg = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        notifications.push({
          id: `msg_${c.id}`,
          type: "message",
          title: "Pesan Baru",
          content: `Anda memiliki ${msgs.length} pesan baru dari ${other.username}.`,
          user: other,
          link: `/main/chat/${c.id}`,
          created_at: lastMsg.created_at,
          icon: "💬",
          color: "bg-green-100 text-green-600"
        })
      }
    })
  }

  // 4. Replies to My Posts
  const { data: myPosts } = await supabase.from("posts").select("id").eq("user_id", user.id)
  if (myPosts && myPosts.length > 0) {
    const myPostIds = myPosts.map(p => p.id)
    const { data: replies } = await supabase
      .from("posts")
      .select("id, content, created_at, profiles:user_id(id, username, avatar_url)")
      .in("parent_id", myPostIds)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (replies) {
      replies.forEach(reply => {
        const p = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles
        if (p) {
          notifications.push({
            id: `reply_${reply.id}`,
            type: "reply",
            title: "Balasan Baru",
            content: `${p.username} membalas postingan Anda.`,
            user: p,
            link: `/main/feed`,
            created_at: reply.created_at,
            icon: "↩️",
            color: "bg-pink-100 text-pink-600"
          })
        }
      })
    }
  }

  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full border border-slate-100/50 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifikasi</h1>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              🔔
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada notifikasi</h2>
            <p className="text-slate-500">Pemberitahuan aktivitas baru akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <Link key={notif.id} href={notif.link} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors group">
                <div className="relative shrink-0">
                  {notif.user?.avatar_url ? (
                    <img src={notif.user.avatar_url} alt={notif.user.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-linear-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {notif.user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white ${notif.color}`}>
                    {notif.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-[15px]">{notif.title}</p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(notif.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{notif.content}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
