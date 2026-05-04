import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Ambil profil user
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">My Olshop</h2>
        
        <nav className="flex flex-col gap-2 flex-1">
          <a href="/main" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            Dashboard
          </a>
          <a href="/main/feed" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            Feed
          </a>
          <a href="/main/contacts" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            Contacts
          </a>
          <a href="/main/chat" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            Chat
          </a>
        </nav>

        {/* User info */}
        <div className="border-t pt-4">
          <p className="font-medium">{profile?.username || "User"}</p>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-red-500 hover:underline">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}