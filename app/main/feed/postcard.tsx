"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import PostForm from "./postform"
import AddFriendButton from "@/app/main/contacts/AddFriendButton"
import Image from "next/image"

type Profile = { id: string; username: string; avatar_url: string | null }
type Post = {
  id: string; content: string; image_url: string | null
  created_at: string; user_id: string; parent_id?: string | null
  profiles: Profile | null; replies?: Post[]
  like_count?: number; is_liked?: boolean; is_bookmarked?: boolean
}

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]
import Link from "next/link"

function RenderContent({ text }: { text: string }) {
  // Pecah berdasarkan @[nama berspasi] ATAU @nama_biasa
  const parts = text.split(/(@\[[^\]]+\]|@\w+)/g)
  return (
    <p className="mt-1.5 text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("@[")) {
          const name = part.slice(2, -1)
          return (
            <Link key={i} href={`/main/u/${encodeURIComponent(name)}`} className="inline-block bg-blue-50 text-blue-600 px-1.5 py-0.5 mx-0.5 rounded-md font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
              @{name}
            </Link>
          )
        } else if (part.startsWith("@")) {
          const name = part.slice(1)
          return (
            <Link key={i} href={`/main/u/${encodeURIComponent(name)}`} className="inline-block bg-blue-50 text-blue-600 px-1.5 py-0.5 mx-0.5 rounded-md font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
              {part}
            </Link>
          )
        }
        return part
      })}
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
      .then(({ data }: { data: any }) => {
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
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
        ) : (
          <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white`}>
            {profile.username[0].toUpperCase()}
          </div>
        )}
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

let cachedUserPromise: Promise<string | null> | null = null;
const fetchCurrentUserId = (supabase: any): Promise<string | null> => {
  if (!cachedUserPromise) {
    cachedUserPromise = supabase.auth.getUser().then(({ data }: { data: any }) => data.user?.id || null);
  }
  return cachedUserPromise!;
};

export default function PostCard({ post, isReply = false, rootId, isLastReply = false }: {
  post: Post; isReply?: boolean; rootId?: string; isLastReply?: boolean
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liked, setLiked] = useState(post.is_liked ?? false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked ?? false)
  const [showReplies, setShowReplies] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [reposted, setReposted] = useState(false)
  const popoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUserId(supabase).then(id => setCurrentUserId(id))
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

  const handleMouseEnter = () => {
    if (popoverTimeout.current) clearTimeout(popoverTimeout.current)
    popoverTimeout.current = setTimeout(() => setShowPopover(true), 500)
  }

  const handleMouseLeave = () => {
    if (popoverTimeout.current) clearTimeout(popoverTimeout.current)
    popoverTimeout.current = setTimeout(() => setShowPopover(false), 300)
  }

  const color = getColor(post.profiles?.username || "a")
  const replyCount = post.replies?.length ?? 0

  const repostCount = reposted ? 1 : 0;

  return (
    <div className={`bg-white ${isReply ? "pt-3 pb-1 pr-4" : "p-4 border-b border-slate-100 hover:bg-slate-50/30 transition-colors"} cursor-pointer`}>
      <div className="flex gap-3">
        {/* Avatar Area with Line */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={`/main/u/${encodeURIComponent(post.profiles?.username || "")}`}
              className={`w-10 h-10 block ${post.profiles?.avatar_url ? 'bg-transparent' : color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm hover:opacity-90 transition-all overflow-hidden`}>
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                post.profiles?.username?.[0]?.toUpperCase() || "?"
              )}
            </Link>
            {showPopover && post.profiles && (
              <UserPopover profile={post.profiles} currentUserId={currentUserId} onClose={() => setShowPopover(false)} />
            )}
          </div>
          
          {/* Thread Connecting Line */}
          {(!isLastReply && isReply) || (post.replies && post.replies.length > 0) ? (
            <div className="w-[2px] bg-slate-200 mt-2 flex-1 rounded-full absolute top-10 bottom-[-15px]"></div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div 
              className="flex items-center gap-1.5"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/main/u/${encodeURIComponent(post.profiles?.username || "")}`}
                className="font-bold text-slate-900 hover:underline transition-colors text-[15px]">
                {post.profiles?.username || "Unknown"}
              </Link>
              <span className="text-slate-500 text-[15px]">@{post.profiles?.username || "unknown"}</span>
              <span className="text-slate-500 text-[15px]">·</span>
              <span className="text-slate-500 text-[15px] hover:underline">{timeAgo(post.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {currentUserId === post.user_id && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={deleting}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all -mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <RenderContent text={post.content} />

          {/* Gambar Postingan */}
          {post.image_url && (
            <div 
              onClick={(e) => { e.stopPropagation(); setShowImageModal(true); }}
              className="mt-3 inline-block rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm cursor-pointer"
            >
              <img
                src={post.image_url}
                alt="Gambar postingan"
                className="max-w-[100%] sm:max-w-[500px] h-auto max-h-[510px] object-cover hover:opacity-90 transition-opacity block"
              />
            </div>
          )}

          {/* Actions (Exact Twitter/X SVGs) */}
          <div className="mt-3 flex items-center justify-between text-slate-500 text-[13px] font-medium max-w-[425px]">
            {/* Reply */}
            <button onClick={(e) => { e.stopPropagation(); setShowReplyForm(!showReplyForm); }}
              className={`flex items-center gap-1 transition hover:text-blue-500 group ${showReplyForm ? "text-blue-500" : ""}`}>
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors -ml-2">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                  <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                </svg>
              </div>
              {replyCount > 0 && <span>{replyCount}</span>}
            </button>

            {/* Repost */}
            <button onClick={(e) => { e.stopPropagation(); setReposted(!reposted); }}
              className={`flex items-center gap-1 transition group ${reposted ? "text-green-500" : "hover:text-green-500"}`}>
              <div className={`p-2 rounded-full group-hover:bg-green-50 transition-colors -ml-2 ${reposted ? "bg-green-50" : ""}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                  <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                </svg>
              </div>
              {repostCount > 0 && <span>{repostCount}</span>}
            </button>

            {/* Like */}
            <button onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className={`flex items-center gap-1 transition group ${liked ? "text-pink-600" : "hover:text-pink-600"}`}>
              <div className={`p-2 rounded-full group-hover:bg-pink-50 transition-colors -ml-2 ${liked ? "bg-pink-50" : ""}`}>
                {liked ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                    <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                    <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                  </svg>
                )}
              </div>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Views */}
            <button onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 transition group hover:text-blue-500">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors -ml-2">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                  <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path>
                </svg>
              </div>
            </button>

            {/* Share & Bookmark */}
            <div className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                className={`flex items-center transition group ${bookmarked ? "text-blue-500" : "hover:text-blue-500"}`}>
                <div className={`p-2 rounded-full group-hover:bg-blue-50 transition-colors ${bookmarked ? "bg-blue-50" : ""}`}>
                  {bookmarked ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                      <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                      <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path>
                    </svg>
                  )}
                </div>
              </button>
              
              <button onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/main/feed/${post.id}`);
                alert("Tautan disalin!");
              }}
                className="flex items-center transition group hover:text-blue-500">
                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18.5px] h-[18.5px]" fill="currentColor" stroke="none">
                    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {showReplyForm && (
            <div className="mt-2 mb-2" onClick={(e) => e.stopPropagation()}>
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

      {/* Render Replies Line and Threads */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-2">
          {!showReplies && !isReply ? (
            <div className="ml-12 pl-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowReplies(true); }}
                className="text-[14px] font-medium text-blue-500 hover:underline flex items-center gap-2 py-1"
              >
                Tampilkan utas
              </button>
            </div>
          ) : (
            <div className={`space-y-0 ${isReply ? "mt-1" : ""}`}>
              {post.replies.map((reply, index) => (
                <PostCard 
                  key={reply.id} 
                  post={reply} 
                  isReply 
                  rootId={post.id} 
                  isLastReply={index === post.replies!.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {showImageModal && post.image_url && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-default backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
        >
          <button 
            className="absolute top-4 left-4 p-2 text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6" fill="currentColor" stroke="none">
              <path d="M13.414 12l5.793-5.793c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0L12 10.586 6.207 4.793c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414L10.586 12l-5.793 5.793c-.39.39-.39 1.023 0 1.414.195.195.45.293.707.293s.512-.098.707-.293L12 13.414l5.793 5.793c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414L13.414 12z"></path>
            </svg>
          </button>
          <img
            src={post.image_url}
            alt="Gambar penuh"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}