"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import PostForm from "./postform"
import AddFriendButton from "@/app/main/contacts/AddFriendButton"

type Profile = { id: string; username: string; avatar_url: string | null }
type Post = {
  id: string; content: string; image_url: string | null
  created_at: string; user_id: string; parent_id?: string | null
  profiles: Profile | null; replies?: Post[]
  like_count?: number; is_liked?: boolean; is_bookmarked?: boolean
}

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

function RenderContent({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap wrap-break-words">
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="text-blue-500 font-medium cursor-pointer hover:underline">{part}</span>
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

// Mini profile popup saat klik avatar/username
function UserPopover({ profile, currentUserId, onClose }: {
  profile: Profile; currentUserId: string | null; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [friendStatus, setFriendStatus] = useState<"none" | "pending_sent" | "pending_received" | "friends">("none")
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  useEffect(() => {
    if (!currentUserId || currentUserId === profile.id) { setLoadingStatus(false); return }
    supabase
      .from("friendships")
      .select("id, requester_id, status")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${currentUserId})`
      )
      .single()
      .then(({ data }) => {
        if (!data) setFriendStatus("none")
        else if (data.status === "accepted") setFriendStatus("friends")
        else if (data.requester_id === currentUserId) setFriendStatus("pending_sent")
        else setFriendStatus("pending_received")
        setLoadingStatus(false)
      })
  }, [])

  const color = getColor(profile.username)

  return (
    <div ref={ref}
      className="absolute left-0 top-12 z-50 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      onClick={(e) => e.stopPropagation()}>
      {/* Banner */}
      <div className={`h-12 ${color} opacity-20`} />
      <div className="px-4 pb-4 -mt-6">
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white`}>
          {profile.username[0].toUpperCase()}
        </div>
        <p className="font-bold mt-2 text-sm">{profile.username}</p>
        <p className="text-xs text-gray-400">@{profile.username}</p>

        {currentUserId && currentUserId !== profile.id && (
          <div className="mt-3">
            {loadingStatus ? (
              <span className="text-xs text-gray-400">Memuat...</span>
            ) : (
              <AddFriendButton
                targetUserId={profile.id}
                currentUserId={currentUserId}
                initialStatus={friendStatus}
                size="sm"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostCard({ post, isReply = false, rootId }: {
  post: Post; isReply?: boolean; rootId?: string
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
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

  const color = getColor(post.profiles?.username || "a")
  const replyCount = post.replies?.length ?? 0

  return (
    <div className={`bg-white ${isReply ? "pt-4 pb-2" : "p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"}`}>
      <div className="flex gap-4">
        {/* Avatar — klik buka popover */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPopover(!showPopover)}
            className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner hover:opacity-90 hover:scale-105 transition-all`}>
            {post.profiles?.username?.[0]?.toUpperCase() || "?"}
          </button>
          {showPopover && post.profiles && (
            <UserPopover
              profile={post.profiles}
              currentUserId={currentUserId}
              onClose={() => setShowPopover(false)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPopover(!showPopover)}
                className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                {post.profiles?.username || "Unknown"}
              </button>
              <span className="text-slate-400 text-xs font-medium">· {timeAgo(post.created_at)}</span>
            </div>
            {currentUserId === post.user_id && (
              <button onClick={handleDelete} disabled={deleting}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <RenderContent text={post.content} />

          {/* Actions */}
          <div className="mt-4 flex items-center gap-6 text-slate-400 text-sm font-medium">
            <button onClick={() => setShowReplyForm(!showReplyForm)}
              className={`flex items-center gap-2 transition hover:text-blue-600 group ${showReplyForm ? "text-blue-600" : ""}`}>
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors -ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              {replyCount > 0 && <span>{replyCount}</span>}
            </button>

            <button onClick={handleLike}
              className={`flex items-center gap-2 transition group ${liked ? "text-pink-500" : "hover:text-pink-500"}`}>
              <div className={`p-2 rounded-full group-hover:bg-pink-50 transition-colors -ml-2 ${liked ? "bg-pink-50" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <button onClick={handleBookmark}
              className={`flex items-center gap-2 transition ml-auto group ${bookmarked ? "text-indigo-500" : "hover:text-indigo-500"}`}>
              <div className={`p-2 rounded-full group-hover:bg-indigo-50 transition-colors -mr-2 ${bookmarked ? "bg-indigo-50" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </button>
          </div>

          {showReplyForm && (
            <div className="mt-2 -ml-2">
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

      {post.replies && post.replies.length > 0 && (
        <div className="ml-[28px] mt-2 border-l-2 border-slate-100 pl-8 space-y-2">
          {post.replies.map((reply) => (
            <PostCard key={reply.id} post={reply} isReply rootId={post.id} />
          ))}
        </div>
      )}
    </div>
  )
}