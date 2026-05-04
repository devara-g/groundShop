"use client"

import PostCard from "./postcard"

type Profile = {
  id: string
  username: string
  avatar_url: string | null
}

type Post = {
  id: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
  parent_id?: string | null
  profiles: Profile | null
  replies?: Post[]
}

export default function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada postingan</h2>
        <p className="text-slate-500">Jadilah yang pertama menyapa dunia hari ini!</p>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}