"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"

export default function MessageInput({ conversationId, currentUserId }: {
  conversationId: string
  currentUserId: string
}) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender_id: string } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const handleReply = (e: any) => {
      setReplyTo(e.detail)
      inputRef.current?.focus()
    }
    window.addEventListener("setReplyTo", handleReply)
    return () => window.removeEventListener("setReplyTo", handleReply)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    inputRef.current?.focus()
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        sendAudioMessage(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Gagal akses mikrofon:", err)
      toast("Tidak dapat mengakses mikrofon. Pastikan browser Anda mengizinkan akses.", "error")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null // override biar nggak dikirim
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    setSending(true)
    const path = `${currentUserId}/vn_${Date.now()}.webm`
    const { error: uploadErr } = await supabase.storage
      .from("post_images")
      .upload(path, audioBlob)

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from("post_images").getPublicUrl(path)
      let finalContent = `[audio:${publicUrl}]`
      if (replyTo) {
        finalContent = `[reply:${replyTo.id}]\n${finalContent}`
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: finalContent,
      })
    }
    
    setReplyTo(null)
    setSending(false)
  }

  const handleSend = async () => {
    const text = content.trim()
    if ((!text && !imageFile) || sending) return
    setSending(true)

    let finalContent = text

    if (imageFile) {
      const ext = imageFile.name.split(".").pop()
      const path = `${currentUserId}/chat_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("post_images")
        .upload(path, imageFile)

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from("post_images").getPublicUrl(path)
        finalContent = `[image:${publicUrl}]\n${text}`
      }
    }

    if (replyTo) {
      finalContent = `[reply:${replyTo.id}]\n${finalContent}`
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: finalContent,
    })

    setContent("")
    removeImage()
    setReplyTo(null)
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <div className="p-3 md:p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Preview Balasan */}
        {replyTo && (
          <div className="mb-2 relative inline-flex items-center w-full max-w-sm bg-slate-100/80 p-3 rounded-xl border-l-4 border-blue-500 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-blue-600 mb-0.5">{replyTo.sender_id === currentUserId ? "Membalas pesan Anda" : "Membalas pesan"}</p>
              <p className="text-sm text-slate-600 truncate">
                {(() => {
                  let text = replyTo.content.replace(/^\[reply:.+?\]\n?/g, "")
                  const hasImg = text.match(/^\[image:.+?\]/)
                  text = text.replace(/^\[image:.+?\]\n?/g, "").trim()
                  return hasImg ? (text ? `📷 ${text}` : "📷 Gambar") : text
                })()}
              </p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="ml-3 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {imagePreview && (
          <div className="mb-3 relative inline-block self-start">
            <img src={imagePreview} className="h-32 w-auto rounded-xl border border-slate-200 shadow-sm object-cover" alt="preview" />
            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-slate-900 transition-colors">×</button>
          </div>
        )}
        {isRecording ? (
          <div className="flex items-center gap-3 w-full bg-slate-100/70 px-4 py-3 md:py-3.5 rounded-full">
            <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full shrink-0"></span>
            <span className="font-bold text-red-500 min-w-12 text-sm md:text-base">{formatTime(recordingTime)}</span>
            <div className="flex-1 text-slate-500 text-sm font-medium animate-pulse hidden sm:block">Merekam suara...</div>
            <button onClick={cancelRecording} className="text-slate-500 font-bold text-sm px-3 py-1 hover:text-slate-800 transition-colors">Batal</button>
            <button
              onClick={stopRecording}
              className="w-8 h-8 md:w-10 md:h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold hover:bg-green-600 transition-all shrink-0 shadow-md hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 md:gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <button 
              type="button" 
              onClick={() => fileRef.current?.click()}
              className="p-2 md:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0"
            >
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
            
            {content.trim() || imageFile ? (
              <button
                onClick={handleSend}
                disabled={sending}
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
            ) : (
              <button
                onClick={startRecording}
                disabled={sending}
                className="w-10 h-10 md:w-12 md:h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 disabled:opacity-50 transition-all shrink-0 ml-1"
                title="Kirim Pesan Suara"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
