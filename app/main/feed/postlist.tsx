"use client"

import PostCard from "./postcard"

type Post = {
  id: string
  content: string
  image_url: string | null
  created_at: string
  user_id: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  } | null
}

export default function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Belum ada postingan</p>
        <p className="text-sm">Jadilah yang pertama posting!</p>
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