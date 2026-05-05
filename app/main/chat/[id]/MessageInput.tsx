"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export default function MessageInput({ conversationId, currentUserId }: {
  conversationId: string
  currentUserId: string
}) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSend = async () => {
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    setContent("")

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
    })

    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <div className="p-3 md:p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-10">
      <div className="flex items-center gap-1.5 md:gap-2 max-w-4xl mx-auto">
        <button type="button" className="p-2 md:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ketik pesan..."
          className="flex-1 min-w-0 px-4 md:px-5 py-3 md:py-3.5 bg-slate-100/70 rounded-full text-[14px] md:text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-inner transition-all border-none"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all shrink-0 ml-1"
        >
          {sending ? (
            <span className="animate-spin text-lg md:text-xl">⏳</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5 ml-0.5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
