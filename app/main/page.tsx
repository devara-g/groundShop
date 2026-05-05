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
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Beranda</h1>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto p-6 md:p-8 hide-scrollbar">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Halo, {profile?.username || "User"}
          </h2>
          <p className="text-[14px] text-slate-500 mt-1">Selamat datang kembali di My Olshop.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {/* Stat Cards */}
          <div className="border border-slate-100 p-5 rounded-2xl bg-white flex flex-col items-center justify-center text-center">
            <span className="block text-2xl font-black text-slate-900">{postCount || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Postingan</span>
          </div>
          <div className="border border-slate-100 p-5 rounded-2xl bg-white flex flex-col items-center justify-center text-center">
            <span className="block text-2xl font-black text-slate-900">{friendCount || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Teman</span>
          </div>
          <div className="border border-slate-100 p-5 rounded-2xl bg-white flex flex-col items-center justify-center text-center">
            <span className="block text-2xl font-black text-slate-900">{chatCount || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Pesan</span>
          </div>
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 px-1">Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Jelajah", href: "/main/feed", icon: "🌐" },
              { name: "Teman", href: "/main/contacts", icon: "👥" },
              { name: "Pesan", href: "/main/chat", icon: "💬" },
              { name: "Marketplace", href: "/main/payment", icon: "🛍️" },
            ].map((menu) => (
              <Link
                key={menu.name}
                href={menu.href}
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-center group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm mb-3 group-hover:scale-105 transition-transform">
                  {menu.icon}
                </div>
                <h4 className="font-bold text-slate-800 text-[13px]">{menu.name}</h4>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}