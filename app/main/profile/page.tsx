import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditProfileForm from "./EditProfileForm"
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
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full border border-slate-100/50 shadow-sm">
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
        {/* IG Style Header */}
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-50">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.username}</h1>
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-6 pb-6">
          {/* Top Section: Avatar & Stats */}
          <div className="flex items-center gap-6 md:gap-10">
            {/* Avatar with IG-like ring */}
            <div className="shrink-0 relative group cursor-pointer">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 shadow-sm transition-transform group-hover:scale-105 duration-300">
                <div className="w-full h-full bg-white rounded-full p-0.5">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || "avatar"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-black text-3xl`}>
                      {profile?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 flex justify-around md:justify-start md:gap-12 text-center">
              <div className="flex flex-col items-center">
                <span className="block text-xl font-black text-slate-900">{posts.length}</span>
                <span className="text-[13px] font-medium text-slate-500">kiriman</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="block text-xl font-black text-slate-900">{friendCount || 0}</span>
                <span className="text-[13px] font-medium text-slate-500">teman</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="block text-xl font-black text-slate-900">{likedIds.size}</span>
                <span className="text-[13px] font-medium text-slate-500">suka</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-5 px-1">
            <p className="font-bold text-[15px] text-slate-900">{profile?.username}</p>
            <p className="text-[14px] text-slate-500 mt-0.5">Toko Aktif</p>
            <p className="text-[14px] text-slate-700 mt-1 leading-relaxed">
              Selamat datang di profil saya! Hubungi saya untuk informasi produk lebih lanjut.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex gap-2">
            <div className="flex-1">
              <EditProfileForm currentUsername={profile?.username || ""} currentAvatarUrl={profile?.avatar_url} />
            </div>
            <button className="flex-1 px-4 py-1.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors text-[14px]">
              Bagikan profil
            </button>
          </div>
        </div>

        {/* Tabungan Etalase & Post */}
        <ProfileTabs posts={posts as any} />
      </div>
    </div>
  )
}
