import { createServerSupabase } from "@/lib/supabase/server"
import PostForm from "./postform"
import PostList from "./postlist"
import Link from "next/link"

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const currentTab = tab === 'following' ? 'following' : 'foryou';
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  let friendIds: string[] = [];
  if (currentTab === 'following' && user) {
    const { data: friends } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
    if (friends) {
      friendIds = friends.map((f: any) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
    }
    friendIds.push(user.id);
  }

  let query = supabase
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
    .order("created_at", { ascending: false });

  if (currentTab === 'following') {
    // Apabila belum berteman dengan siapa pun, kita pastikan array tidak kosong untuk .in()
    query = query.in("user_id", friendIds.length > 0 ? friendIds : [user!.id]);
  }

  const { data: rawPosts } = await query;

  const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user!.id),
    supabase.from("bookmarks").select("post_id").eq("user_id", user!.id),
  ])

  const likedIds = new Set((userLikes || []).map((l: any) => l.post_id))
  const bookmarkedIds = new Set((userBookmarks || []).map((b: any) => b.post_id))

  const norm = (p: any) => (Array.isArray(p) ? p[0] ?? null : p)

  const posts = (rawPosts || []).map((post: any) => ({
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
    <div className="flex flex-col h-full bg-transparent w-full">
      <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-2xl border-b border-slate-100/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight px-6 pt-5 pb-1">Beranda</h1>
        <div className="flex w-full mt-1 font-bold text-slate-500 text-[15px]">
          <Link href="/main/feed?tab=foryou" className="flex-1 text-center hover:bg-slate-50/50 cursor-pointer transition-colors pt-3 pb-4 relative group block">
            <span className={`transition-colors ${currentTab === 'foryou' ? "text-slate-900" : "group-hover:text-slate-700"}`}>Untuk Anda</span>
            {currentTab === 'foryou' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full"></div>}
          </Link>
          <Link href="/main/feed?tab=following" className="flex-1 text-center hover:bg-slate-50/50 cursor-pointer transition-colors pt-3 pb-4 relative group block">
            <span className={`transition-colors ${currentTab === 'following' ? "text-slate-900" : "group-hover:text-slate-700"}`}>Mengikuti</span>
            {currentTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full"></div>}
          </Link>
        </div>
      </div>
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto pb-20 hide-scrollbar bg-white">
        <PostForm />
        <div className="w-full">
          <PostList posts={posts as any} />
        </div>
      </div>
    </div>
  )
}