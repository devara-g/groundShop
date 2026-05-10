import { createServerSupabase } from "@/lib/supabase/server"
import PostCard from "../postcard"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: rawPost, error } = await supabase
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
    .eq("id", id)
    .single()

  if (error || !rawPost) {
    return notFound()
  }

  const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user.id),
    supabase.from("bookmarks").select("post_id").eq("user_id", user.id),
  ])

  const likedIds = new Set((userLikes || []).map((l: any) => l.post_id))
  const bookmarkedIds = new Set((userBookmarks || []).map((b: any) => b.post_id))

  const norm = (p: any) => (Array.isArray(p) ? p[0] ?? null : p)

  const post = {
    ...rawPost,
    profiles: norm(rawPost.profiles),
    like_count: (rawPost.likes as any)?.[0]?.count ?? 0,
    is_liked: likedIds.has(rawPost.id),
    is_bookmarked: bookmarkedIds.has(rawPost.id),
    replies: ((rawPost.replies as any[]) || [])
      .map((r) => ({
        ...r,
        profiles: norm(r.profiles),
        like_count: (r.likes as any)?.[0]?.count ?? 0,
        is_liked: likedIds.has(r.id),
        is_bookmarked: bookmarkedIds.has(r.id),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }

  return (
    <div className="flex flex-col h-full bg-white w-full">
      <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-2xl border-b border-slate-100/60 flex items-center px-4 py-3 gap-4">
        <Link href="/main/feed" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Postingan</h1>
      </div>
      
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto pb-20 hide-scrollbar border-x border-slate-100 min-h-screen">
        <PostCard post={post as any} defaultShowReplies={true} />
      </div>
    </div>
  )
}
