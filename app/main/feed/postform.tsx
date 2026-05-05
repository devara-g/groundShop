"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

type UserSuggestion = { id: string; username: string; avatar_url: string | null }

type Props = {
  parentId?: string
  placeholder?: string
  onSuccess?: () => void
  compact?: boolean
}

export default function PostForm({
  parentId,
  placeholder = "Apa yang kamu pikirkan?",
  onSuccess,
  compact = false,
}: Props) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    const cursor = e.target.selectionStart
    const textUpToCursor = val.slice(0, cursor)
    const match = textUpToCursor.match(/@(\w*)$/)
    if (match) {
      const query = match[1]
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `${query}%`)
        .limit(5)
      setSuggestions(data || [])
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const insertMention = (username: string) => {
    const cursor = textareaRef.current?.selectionStart || content.length
    const before = content.slice(0, cursor).replace(/@(\w*)$/, `@${username} `)
    const after = content.slice(cursor)
    setContent(before + after)
    setShowSuggestions(false)
    setSuggestions([])
    textareaRef.current?.focus()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let imageUrl: string | null = null

    // Upload gambar kalau ada
    if (imageFile) {
      const ext = imageFile.name.split(".").pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("post_images")
        .upload(path, imageFile)

      if (uploadErr) {
        console.error("Upload error:", uploadErr.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from("post_images").getPublicUrl(path)
      imageUrl = publicUrl
    }

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      image_url: imageUrl,
      ...(parentId && { parent_id: parentId }),
    })

    if (!error) {
      setContent("")
      removeImage()
      router.refresh()
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-4" : "p-6 bg-white border-b border-slate-100"}>
      <div className="flex gap-4">
        {!compact && (
          <div className="w-12 h-12 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg shadow-inner shrink-0">
            ?
          </div>
        )}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={placeholder}
            rows={compact ? 2 : 3}
            className={`w-full bg-transparent resize-none focus:outline-none placeholder-slate-400 text-slate-800 ${compact ? "text-sm p-3 border border-slate-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" : "text-lg mt-2 min-h-[60px]"}`}
          />

          {/* @mention dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-1">
              {suggestions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={() => insertMention(u.username)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm flex items-center gap-3 transition-colors"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {u.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold text-slate-700">@{u.username}</span>
                </button>
              ))}
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-72 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          <div className={`flex items-center justify-between mt-2 ${!compact && "pt-4 border-t border-slate-50"}`}>
            <div className="flex items-center gap-1">
              {/* Tombol upload foto */}
              {!compact && (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    title="Tambah foto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </>
              )}
              <span className="text-xs font-medium text-slate-400">
                {content.length > 0 && `${content.length}/280`}
              </span>
            </div>

            <div className="flex gap-2">
              {onSuccess && (
                <button type="button" onClick={onSuccess}
                  className="px-5 py-2 text-sm font-bold text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (!content.trim() && !imageFile) || content.length > 280}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
              >
                {loading ? "..." : parentId ? "Balas" : "Posting"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}