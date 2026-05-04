import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/main", icon: "🏠", label: "Beranda" },
  { href: "/main/feed", icon: "🌐", label: "Jelajah" },
  { href: "/main/contacts", icon: "👥", label: "Teman" },
  { href: "/main/chat", icon: "💬", label: "Pesan" },
  { href: "/main/profile", icon: "👤", label: "Profil" },
]

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/70 backdrop-blur-xl border-r border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            M
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">
            My Olshop
          </h2>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} 
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all group font-medium">
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="mt-auto bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
              {profile?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{profile?.username}</p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative w-full pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto md:p-4">
          <div className="bg-white md:rounded-3xl shadow-sm border-x border-b md:border-t border-slate-100 min-h-full overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 pb-safe z-50">
        <nav className="flex items-center justify-around p-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} 
              className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}