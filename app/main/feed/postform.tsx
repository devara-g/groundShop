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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-700">@{u.username}</span>
                </button>
              ))}
            </div>
          )}

          <div className={`flex items-center justify-between mt-2 ${!compact && "pt-4 border-t border-slate-50"}`}>
            <span className="text-xs font-medium text-slate-400">
              {content.length > 0 && `${content.length}/280`}
            </span>
            <div className="flex gap-2">
              {onSuccess && (
                <button type="button" onClick={onSuccess}
                  className="px-5 py-2 text-sm font-bold text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !content.trim() || content.length > 280}
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