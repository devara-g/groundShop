"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type UserSuggestion = { id: string; username: string }

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    // Cek apakah user sedang mengetik @mention
    const cursor = e.target.selectionStart
    const textUpToCursor = val.slice(0, cursor)
    const match = textUpToCursor.match(/@(\w*)$/)

    if (match) {
      const query = match[1]
      const { data } = await supabase
        .from("profiles")
        .select("id, username")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      ...(parentId && { parent_id: parentId }),
    })

    if (!error) {
      setContent("")
      router.refresh()
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "" : "p-4 border-b bg-white"}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* @mention dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 top-full mt-1 w-56 bg-white border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={() => insertMention(u.username)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {u.username[0].toUpperCase()}
                </div>
                <span className="font-medium">@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          {content.length > 0 && `${content.length}/280`}
        </span>
        <div className="flex gap-2">
          {onSuccess && (
            <button type="button" onClick={onSuccess}
              className="px-4 py-1.5 text-sm rounded-full border hover:bg-gray-50 transition">
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !content.trim() || content.length > 280}
            className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Posting..." : parentId ? "Balas" : "Post"}
          </button>
        </div>
      </div>
    </form>
  )
}