"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

type Props = {
  post: {
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
}

export default function PostCard({ post }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Cek user yang login
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  const handleDelete = async () => {
    if (!confirm("Hapus postingan ini?")) return
    setDeleting(true)
    
    const { error } = await supabase.from("posts").delete().eq("id", post.id)
    if (!error) router.refresh()
    else setDeleting(false)
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const postDate = new Date(date)
    const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000)

    if (diff < 60) return "Baru saja"
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}h`
  }

  return (
    <div className="p-4 border-b bg-white hover:bg-gray-50 transition">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
          {post.profiles?.username?.[0]?.toUpperCase() || "?"}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {post.profiles?.username || "Unknown"}
            </span>
            <span className="text-gray-500 text-sm">· {timeAgo(post.created_at)}</span>
          </div>

          {/* Content */}
          <p className="mt-1 whitespace-pre-wrap">{post.content}</p>

          {/* Delete button */}
          {currentUserId === post.user_id && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}