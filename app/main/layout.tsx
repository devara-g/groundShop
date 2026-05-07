import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import logoImg from "@/img/ChatGPT Image May 6, 2026, 05_48_53 PM.png"
import { DesktopNav, MobileNav } from "./NavClient"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single()

  const { data: unreadConvos } = await supabase
    .from("conversations")
    .select("id, messages!inner(id)")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .eq("messages.is_read", false)
    .neq("messages.sender_id", user.id)
    
  const unreadCount = unreadConvos?.reduce((acc, c) => acc + (Array.isArray(c.messages) ? c.messages.length : 0), 0) || 0

  return (
    <div className="flex h-screen bg-[#F4F7FA] selection:bg-blue-500/30">
      {/* Decorative Background Blob */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-0 mix-blend-multiply"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-0 mix-blend-multiply"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/60 backdrop-blur-2xl border-r border-white/50 p-6 z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3 mb-10 px-2 mt-4 group cursor-pointer">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20 border border-white group-hover:scale-105 transition-transform duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-20"></div>
            <Image src={logoImg} alt="LapakSapa Logo" className="w-full h-full object-cover relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight group-hover:from-blue-600 group-hover:to-indigo-600 transition-colors duration-300">
            LapakSapa
          </h2>
        </div>
        
        <DesktopNav unreadCount={unreadCount} />

        {/* User Card */}
        <div className="mt-auto bg-white/80 hover:bg-white transition-all duration-300 rounded-2xl p-3 border border-white/60 shadow-sm hover:shadow-md flex items-center justify-between group">
          <Link href="/main/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-11 h-11 rounded-full object-cover shadow-sm border-2 border-white" />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center font-bold text-white shadow-sm border-2 border-white">
                  {profile?.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-[14px] text-slate-800 truncate group-hover:text-blue-600 transition-colors">{profile?.username}</p>
              <p className="text-[11px] font-medium text-slate-400">Lihat profil</p>
            </div>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Keluar">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative w-full pb-16 md:pb-0 z-10">
        <div className="flex-1 h-full w-full max-w-4xl mx-auto overflow-hidden flex flex-col bg-white md:shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)] md:border-x border-slate-100/60">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100/50 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <MobileNav unreadCount={unreadCount} />
      </div>
    </div>
  )
}