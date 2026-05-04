import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditProfileForm from "./EditProfileForm"
import PostList from "@/app/main/feed/postlist"
import ProfileTabs from "./ProfileTabs"

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Ambil postingan user ini saja (sebagai marketplace nanti)
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
    .eq("user_id", user.id)
    .is("parent_id", null)
    .order("created_at", { ascending: false })

  const [{ data: userLikes }, { data: userBookmarks }, { count: friendCount }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user.id),
    supabase.from("bookmarks").select("post_id").eq("user_id", user.id),
    supabase.from("friendships").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
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

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full">
      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto">
        {/* Banner */}
        <div className={`h-40 w-full bg-linear-to-r ${gradient} relative`}>
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl">
              <div className={`w-full h-full bg-linear-to-br ${gradient} rounded-full flex items-center justify-center text-white font-black text-4xl`}>
                {profile?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-slate-800">{profile?.username}</h1>
              <p className="text-slate-500 font-medium mt-1">@{profile?.username} • Toko Aktif</p>
              
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <span className="block text-xl font-black text-slate-800">{posts.length}</span>
                  <span className="text-xs text-slate-500 font-medium">Postingan</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-black text-slate-800">{friendCount || 0}</span>
                  <span className="text-xs text-slate-500 font-medium">Teman</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-black text-slate-800">{likedIds.size}</span>
                  <span className="text-xs text-slate-500 font-medium">Suka</span>
                </div>
              </div>
            </div>
            
            <EditProfileForm currentUsername={profile?.username || ""} />
          </div>
        </div>

        {/* Tabungan Etalase & Post */}
        <ProfileTabs posts={posts as any} />
      </div>
    </div>
  )
}
