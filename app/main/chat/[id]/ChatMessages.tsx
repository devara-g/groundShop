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
        event: "*", // Listen to INSERT and UPDATE
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
            if (!exists) return prev // Bukan pesan dari percakapan ini
            return prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
          })
        }
      })
      
    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // Group messages by date
  let lastDate = ""

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-2">
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

        return (
          <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Date separator */}
            {showDate && (
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{msgDate}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Message bubble */}
            <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
              <div className={`max-w-[75%] px-5 py-3 text-[15px] shadow-sm ${
                isMine
                  ? "bg-slate-800 text-white rounded-3xl rounded-br-sm"
                  : "bg-white text-slate-800 rounded-3xl rounded-bl-sm border border-slate-100"
              }`}>
                <p className="leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${isMine ? "text-slate-400" : "text-slate-400"}`}>
                  <span className="text-[11px] font-medium">{timeLabel(msg.created_at)}</span>
                  {isMine && (
                    <span className={`text-[13px] font-bold tracking-tighter ${msg.is_read ? "text-blue-400 drop-shadow-[0_0_2px_rgba(96,165,250,0.5)]" : "text-slate-400"}`}>
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} className="h-2" />
    </div>
  )
}
