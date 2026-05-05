import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
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
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/70 backdrop-blur-xl border-r border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-10 px-2 mt-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            dapshop
          </h2>
        </div>
        
        <DesktopNav unreadCount={unreadCount} />

        {/* User Card */}
        <div className="mt-auto bg-slate-50/50 hover:bg-slate-100 transition-colors rounded-2xl p-3 border border-slate-100 flex items-center justify-between group">
          <Link href="/main/profile" className="flex items-center gap-3 flex-1 min-w-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-10 h-10 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                {profile?.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-bold text-[14px] text-slate-800 truncate group-hover:text-slate-900">{profile?.username}</p>
              <p className="text-[12px] text-slate-400">Lihat profil</p>
            </div>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Keluar">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative w-full pb-16 md:pb-0 bg-white">
        <div className="flex-1 h-full w-full max-w-4xl mx-auto overflow-hidden flex flex-col">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe z-50">
        <MobileNav unreadCount={unreadCount} />
      </div>
    </div>
  )
}