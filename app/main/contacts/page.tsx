import { createServerSupabase } from "@/lib/supabase/server"
import SearchUser from "./SearchUser"
import FriendsList from "./FriendsList"
import PendingRequests from "./PendingRequests"

export default async function ContactsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: friends }, { data: pendingRequests }] = await Promise.all([
    supabase
      .from("friendships")
      .select(`
        id, requester_id, addressee_id, status,
        requester:requester_id(id, username, avatar_url),
        addressee:addressee_id(id, username, avatar_url)
      `)
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
      .eq("status", "accepted"),

    supabase
      .from("friendships")
      .select(`
        id, requester_id, status,
        requester:requester_id(id, username, avatar_url)
      `)
      .eq("addressee_id", user!.id)
      .eq("status", "pending"),
  ])

  return (
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Teman</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto pb-20">
        {/* Left Column: Search & Pending */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span> Cari Pengguna
            </h2>
            <SearchUser currentUserId={user!.id} />
          </div>

          <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔔</span> Permintaan Masuk
            </h2>
            <PendingRequests
              requests={pendingRequests as any || []}
              currentUserId={user!.id}
            />
          </div>
        </div>

        {/* Right Column: Friends List */}
        <div className="flex-1">
          <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span> Daftar Teman
            </h2>
            <FriendsList
              friends={friends as any || []}
              currentUserId={user!.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}