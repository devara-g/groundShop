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
          <form action="/auth/signout" method="post">
            <button type="submit" className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-700 hover:text-red-600" title="Keluar">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>

        <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center">
          {/* Centered Avatar */}
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
            {/* Online badge */}
            <div className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
          </div>

          {/* Name & Bio */}
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-1 mb-3">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[12px] font-bold rounded-full">Toko Aktif</span>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-slate-500 text-sm">Bergabung 2026</span>
          </div>
          <p className="text-[15px] text-slate-600 max-w-md leading-relaxed px-4">
            Selamat datang di profil saya! Hubungi saya untuk informasi produk lebih lanjut. Kepuasan pelanggan adalah prioritas kami.
          </p>

          {/* Stats Box */}
          <div className="flex items-center justify-center w-full max-w-md gap-4 mt-6">
            <div className="flex-1 bg-slate-50 border border-slate-100 py-3 rounded-2xl">
              <span className="block text-xl font-black text-slate-900">{posts.length}</span>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Postingan</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 py-3 rounded-2xl">
              <span className="block text-xl font-black text-slate-900">{friendCount || 0}</span>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Teman</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 py-3 rounded-2xl">
              <span className="block text-xl font-black text-slate-900">{likedIds.size}</span>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Suka</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3 w-full max-w-md">
            <div className="flex-1">
              <EditProfileForm currentUsername={profile?.username || ""} currentAvatarUrl={profile?.avatar_url} />
            </div>
            <button className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-[14px]">
              Bagikan Profil
            </button>
          </div>
        </div>

        {/* Tabungan Etalase & Post */}
        <ProfileTabs posts={posts as any} />
      </div>
    </div>
  )
}
