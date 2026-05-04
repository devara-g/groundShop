import { createServerSupabase } from "@/lib/supabase/server"
import PostForm from "./postform"
import PostList from "./postlist"

export default async function FeedPage() {
  const supabase = await createServerSupabase()
  
  const { data: rawPosts } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      image_url,
      created_at,
      user_id,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  // Normalize: pastikan profiles adalah object tunggal, bukan array
  const posts = (rawPosts || []).map((post) => ({
    ...post,
    profiles: Array.isArray(post.profiles)
      ? (post.profiles[0] ?? null)
      : post.profiles,
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