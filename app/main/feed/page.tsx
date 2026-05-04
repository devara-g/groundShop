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
    <div className="max-w-2xl mx-auto">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold">Feed</h1>
      </div>
      <PostForm />
      <PostList posts={posts as any} />
    </div>
  )
}