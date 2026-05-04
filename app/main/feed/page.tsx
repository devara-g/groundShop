import { createServerSupabase } from "@/lib/supabase/server"
import PostForm from "./postform"
import PostList from "./postlist"

export default async function FeedPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

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
    .is("parent_id", null)
    .order("created_at", { ascending: false })

  const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user!.id),
    supabase.from("bookmarks").select("post_id").eq("user_id", user!.id),
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

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full">
      <div className="px-6 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jelajah <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Feed</span></h1>
      </div>
      <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto pb-20">
        <PostForm />
        <div className="mt-4">
          <PostList posts={posts as any} />
        </div>
      </div>
    </div>
  )
}