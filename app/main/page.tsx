import { createServerSupabase } from "@/lib/supabase/server"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  const [
    { count: postCount },
    { count: friendCount },
    { count: chatCount }
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user!.id).is("parent_id", null),
    supabase.from("friendships").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`),
    supabase.from("conversations").select("*", { count: "exact", head: true }).or(`participant_1.eq.${user!.id},participant_2.eq.${user!.id}`),
  ])

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">{profile?.username || "User"}</span> 👋
        </h1>
        <p className="text-slate-500 mt-2">Selamat datang kembali di dashboard utama kamu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {/* Stat Cards */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-blue-100 font-medium">Total Postingan</p>
          <p className="text-4xl font-black mt-2">{postCount || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-indigo-100 font-medium">Teman Aktif</p>
          <p className="text-4xl font-black mt-2">{friendCount || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-3xl shadow-lg shadow-teal-500/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-teal-100 font-medium">Percakapan</p>
          <p className="text-4xl font-black mt-2">{chatCount || 0}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Akses Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { name: "Jelajah Feed", desc: "Lihat postingan terbaru", href: "/main/feed", icon: "🌐", color: "from-blue-100 to-blue-50", text: "text-blue-600" },
            { name: "Teman", desc: "Kelola jaringanmu", href: "/main/contacts", icon: "👥", color: "from-green-100 to-green-50", text: "text-green-600" },
            { name: "Chat", desc: "Pesan realtime", href: "/main/chat", icon: "💬", color: "from-purple-100 to-purple-50", text: "text-purple-600" },
            { name: "Marketplace", desc: "Belanja pakai Crypto", href: "/main/payment", icon: "🛍️", color: "from-orange-100 to-orange-50", text: "text-orange-600" },
          ].map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${menu.color} rounded-2xl mb-4 flex items-center justify-center text-2xl shadow-inner`}>
                {menu.icon}
              </div>
              <h3 className={`font-bold text-slate-800 group-hover:${menu.text} transition-colors mb-1`}>{menu.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{menu.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}