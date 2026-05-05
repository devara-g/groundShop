import { createServerSupabase } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import ProfileTabs from "../../profile/ProfileTabs"
import AddFriendButton from "../../contacts/AddFriendButton"

export default async function PublicProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params
  const username = decodeURIComponent(params.username)
  const supabase = await createServerSupabase()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Jika klik profil sendiri, lempar ke /main/profile aja
  const { data: currentProfile } = await supabase.from("profiles").select("username").eq("id", currentUser?.id).single()
  if (currentProfile?.username === username) {
    redirect("/main/profile")
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .limit(1)

  console.log("Mencari profil untuk username:", username, "Hasil:", profiles, "Error:", error)

  const profile = profiles?.[0]

  if (!profile) {
    console.error("Profile not found for:", username)
    notFound()
  }

  const { data: rawPosts } = await supabase
    .from("posts")
    .select(`
      id, content, image_url, created_at, user_id, parent_id,
      profiles:user_id (id, username, avatar_url),
      likes(count),
      replies:posts (
        id, content, image_url, created_at, user_id, parent_id,
        profiles:user_id (id, username, avatar_url),
        likes(count)
      )
    `)
    .eq("user_id", profile.id)
    .is("parent_id", null)
    .order("created_at", { ascending: false })

  const [{ data: userLikes }, { data: userBookmarks }, { count: friendCount }, { data: friendship }] = await Promise.all([
    currentUser ? supabase.from("likes").select("post_id").eq("user_id", currentUser.id) : Promise.resolve({ data: [] }),
    currentUser ? supabase.from("bookmarks").select("post_id").eq("user_id", currentUser.id) : Promise.resolve({ data: [] }),
    supabase.from("friendships").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`),
    currentUser ? supabase.from("friendships").select("id, requester_id, status").or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUser.id})`).single() : Promise.resolve({ data: null })
  ])

  const likedIds = new Set((userLikes || []).map((l) => l.post_id))
  const bookmarkedIds = new Set((userBookmarks || []).map((b) => b.post_id))
  const norm = (p: any) => (Array.isArray(p) ? p[0] ?? null : p)

  const posts = (rawPosts || []).map((post) => ({
    ...post,
    profiles: norm(post.profiles),
    like_count: (post.likes as any)?.[0]?.count ?? 0,
    is_liked: likedIds.has(post.id),
    is_bookmarked: bookmarkedIds.has(post.id),
    replies: ((post.replies as any[]) || [])
      .map((r) => ({
        ...r,
        profiles: norm(r.profiles),
        like_count: (r.likes as any)?.[0]?.count ?? 0,
        is_liked: likedIds.has(r.id),
        is_bookmarked: bookmarkedIds.has(r.id),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }))

  const colorClasses = ["from-blue-600 to-indigo-600", "from-purple-600 to-pink-600", "from-teal-500 to-emerald-500", "from-orange-500 to-red-500"]
  const gradient = colorClasses[(profile?.username?.charCodeAt(0) || 0) % colorClasses.length]

  let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none"
  if (friendship) {
    if (friendship.status === "accepted") friendStatus = "friends"
    else if (friendship.requester_id === currentUser?.id) friendStatus = "pending_sent"
    else friendStatus = "pending_received"
  }

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full border border-slate-100/50 shadow-sm">
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
        <div className="px-5 py-4 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-50">
          <a href="/main/feed" className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.username}</h1>
        </div>

        <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-white shadow-md border border-slate-100 transition-transform group-hover:scale-105 duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || "avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-4xl`}>
                    {profile?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-1 mb-3">
            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 text-[12px] font-bold rounded-full">Anggota</span>
          </div>

          <div className="flex items-center justify-center w-full max-w-md gap-4 mt-6">
            <div className="flex-1 bg-slate-50 border border-slate-100 py-3 rounded-2xl">
              <span className="block text-xl font-black text-slate-900">{posts.length}</span>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Postingan</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 py-3 rounded-2xl">
              <span className="block text-xl font-black text-slate-900">{friendCount || 0}</span>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Teman</span>
            </div>
          </div>

          {currentUser && (
            <div className="mt-8 w-full max-w-md">
              <AddFriendButton targetUserId={profile.id} currentUserId={currentUser.id} initialStatus={friendStatus} />
            </div>
          )}
        </div>

        <ProfileTabs posts={posts as any} />
      </div>
    </div>
  )
}
