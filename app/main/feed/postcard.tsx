"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import PostForm from "./postform"

type Profile = { id: string; username: string; avatar_url: string | null }
type Post = {
  id: string; content: string; image_url: string | null
  created_at: string; user_id: string; parent_id?: string | null
  profiles: Profile | null; replies?: Post[]
  like_count?: number; is_liked?: boolean; is_bookmarked?: boolean
}

const AVATAR_COLORS = [
  "bg-blue-500","bg-purple-500","bg-green-500",
  "bg-orange-500","bg-pink-500","bg-red-500","bg-teal-500",
]

// Render @mention sebagai biru
function RenderContent({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="text-blue-500 font-medium">{part}</span>
          : part
      )}
    </p>
  )
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "Baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostCard({ post, isReply = false, rootId }: {
  post: Post; isReply?: boolean; rootId?: string
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liked, setLiked] = useState(post.is_liked ?? false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked ?? false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

  const handleLike = async () => {
    if (!currentUserId) return
    if (liked) {
      setLiked(false); setLikeCount(c => c - 1)
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId)
    } else {
      setLiked(true); setLikeCount(c => c + 1)
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId })
    }
  }

  const handleBookmark = async () => {
    if (!currentUserId) return
    if (bookmarked) {
      setBookmarked(false)
      await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", currentUserId)
    } else {
      setBookmarked(true)
      await supabase.from("bookmarks").insert({ post_id: post.id, user_id: currentUserId })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Hapus postingan ini?")) return
    setDeleting(true)
    const { error } = await supabase.from("posts").delete().eq("id", post.id)
    if (!error) router.refresh()
    else setDeleting(false)
  }

  const avatarColor = AVATAR_COLORS[(post.profiles?.username?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  const replyCount = post.replies?.length ?? 0

  return (
    <div className={`bg-white ${isReply ? "py-3 px-4" : "p-4 border-b"}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm`}>
          {post.profiles?.username?.[0]?.toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{post.profiles?.username || "Unknown"}</span>
            <span className="text-gray-400 text-sm">· {timeAgo(post.created_at)}</span>
            {currentUserId === post.user_id && (
              <button onClick={handleDelete} disabled={deleting}
                className="ml-auto text-gray-300 hover:text-red-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Content dengan @mention highlight */}
          <RenderContent text={post.content} />

          {/* Action bar */}
          <div className="mt-3 flex items-center gap-5 text-gray-400 text-sm">
            {/* Reply */}
            <button onClick={() => setShowReplyForm(!showReplyForm)}
              className={`flex items-center gap-1.5 transition hover:text-blue-500 ${showReplyForm ? "text-blue-500" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {replyCount > 0 && <span>{replyCount}</span>}
            </button>

            {/* Like */}
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 transition ${liked ? "text-red-500" : "hover:text-red-400"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Bookmark */}
            <button onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition ml-auto ${bookmarked ? "text-blue-500" : "hover:text-blue-400"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-3 border-l-2 border-blue-200 pl-3">
              <PostForm
                parentId={rootId || post.id}
                placeholder={`Balas @${post.profiles?.username || "someone"}...`}
                compact
                onSuccess={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="ml-[52px] mt-2 border-l-2 border-gray-100 pl-3">
          {post.replies.map((reply) => (
            <PostCard key={reply.id} post={reply} isReply rootId={post.id} />
          ))}
        </div>
      )}
    </div>
  )
}