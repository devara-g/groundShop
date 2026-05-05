"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Message = {
  id: string
  content: string
  sender_id: string
  is_read: boolean
  created_at: string
  conversation_id?: string
}

function timeLabel(date: string) {
  return new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

function dayLabel(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Hari ini"
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin"
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export default function ChatMessages({ conversationId, initialMessages, currentUserId }: {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("postgres_changes", {
        event: "*", // Listen to INSERT, UPDATE, DELETE
        schema: "public",
        table: "messages",
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newMsg = payload.new as Message
          if (newMsg.conversation_id !== conversationId) return

          setMessages((prev) => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          
          // Mark as read if it's from the other person
          if (newMsg.sender_id !== currentUserId) {
            supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then(() => {})
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedMsg = payload.new as Partial<Message>
          setMessages((prev) => {
            const exists = prev.find(m => m.id === updatedMsg.id)
            if (!exists) return prev
            return prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
          })
        } else if (payload.eventType === "DELETE") {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id))
        }
      })
      
    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // Group messages by date
  let lastDate = ""

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pesan ini? Pesan akan terhapus untuk semua orang.")) return
    
    // Simpan pesan lama buat jaga-jaga kalau gagal
    const originalMessages = [...messages]
    
    // Optimistic UI update
    setMessages(prev => prev.filter(m => m.id !== id))
    
    // Delete from DB
    const { error } = await supabase.from("messages").delete().eq("id", id)
    if (error) {
      console.error(error)
      alert("Gagal menghapus pesan! Pastikan Supabase RLS mengizinkan DELETE: " + error.message)
      // Balikin pesan ke layar kalau gagal
      setMessages(originalMessages)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex flex-col">
      {/* Spacer — mendorong pesan ke bawah */}
      <div className="flex-1" />
      <div className="space-y-2">
      {messages.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-slate-500 font-medium">Belum ada pesan. Mulai percakapan!</p>
        </div>
      )}

      {messages.map((msg) => {
        const msgDate = dayLabel(msg.created_at)
        const showDate = msgDate !== lastDate
        lastDate = msgDate
        const isMine = msg.sender_id === currentUserId

        let replyToId = null
        let imageUrl = null
        let textContent = msg.content

        const replyMatch = textContent.match(/^\[reply:(.+?)\]\n?([\s\S]*)$/)
        if (replyMatch) {
          replyToId = replyMatch[1]
          textContent = replyMatch[2].trim()
        }

        const imgMatch = textContent.match(/^\[image:(.+?)\]\n?([\s\S]*)$/)
        if (imgMatch) {
          imageUrl = imgMatch[1]
          textContent = imgMatch[2].trim()
        }

        const repliedMsg = replyToId ? messages.find(m => m.id === replyToId) : null
        let repliedPreview = ""
        if (repliedMsg) {
          let text = repliedMsg.content.replace(/^\[reply:.+?\]\n?/g, "")
          const hasImg = text.match(/^\[image:.+?\]/)
          text = text.replace(/^\[image:.+?\]\n?/g, "").trim()
          repliedPreview = hasImg ? (text ? `📷 ${text}` : "📷 Gambar") : text
        }

        return (
          <div id={`msg-${msg.id}`} key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors rounded-xl">
            {/* Date separator */}
            {showDate && (
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{msgDate}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Message bubble */}
            <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 group`}>
              <div className="relative flex items-center max-w-[75%]">
                <div className={`px-5 py-3 text-[15px] shadow-sm relative w-full ${
                  isMine
                    ? "bg-slate-800 text-white rounded-3xl rounded-br-sm"
                    : "bg-white text-slate-800 rounded-3xl rounded-bl-sm border border-slate-100"
                }`}>
                  {repliedMsg && (
                    <div
                      onClick={() => {
                        const el = document.getElementById(`msg-${repliedMsg?.id}`)
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        el?.classList.add('bg-white/30')
                        setTimeout(() => el?.classList.remove('bg-white/30'), 1500)
                      }}
                      className="bg-black/20 p-2 rounded-xl mb-2 text-[13px] border-l-4 border-blue-400 cursor-pointer hover:bg-black/30 transition-colors"
                    >
                      <span className="font-bold block text-blue-400 mb-0.5">{repliedMsg?.sender_id === currentUserId ? "Anda" : "Teman"}</span>
                      <span className="line-clamp-2 opacity-80">{repliedPreview}</span>
                    </div>
                  )}

                  {imageUrl && (
                    <img src={imageUrl} alt="attachment" className="rounded-2xl max-w-full mb-2 max-h-64 object-cover border border-white/20" />
                  )}
                  {textContent && <p className="leading-relaxed whitespace-pre-wrap [word-break:break-word]">{textContent}</p>}
                  
                  <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${isMine ? "text-slate-400" : "text-slate-400"}`}>
                    <span className="text-[11px] font-medium">{timeLabel(msg.created_at)}</span>
                    {isMine && (
                      <span className={`text-[13px] font-bold tracking-tighter ${msg.is_read ? "text-blue-400 drop-shadow-[0_0_2px_rgba(96,165,250,0.5)]" : "text-slate-400"}`}>
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Tombol Action (Reply & Delete) */}
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 ${isMine ? "-left-20" : "-right-10"} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10`}>
                  {isMine && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm hover:bg-red-100"
                      title="Hapus pesan"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('setReplyTo', { detail: msg }))}
                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm hover:bg-blue-100"
                    title="Balas pesan"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  )
}
