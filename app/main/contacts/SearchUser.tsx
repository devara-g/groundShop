"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length]

export default function SearchUser({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .neq("id", currentUserId)
      .limit(10)
    setResults(data || [])
    setLoading(false)
  }

  const sendRequest = async (addresseeId: string) => {
    setSent(prev => new Set(prev).add(addresseeId))
    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: addresseeId,
      status: "pending",
    })
    if (error) setSent(prev => { const n = new Set(prev); n.delete(addresseeId); return n })
    else router.refresh()
  }

  return (
    <div className="">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik username..."
            className="w-full pl-12 pr-4 py-3 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} disabled={loading}
          className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all">
          {loading ? "..." : "Cari"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-50 hover:border-blue-100 hover:shadow-md transition-all group gap-3 sm:gap-0">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-12 h-12 rounded-xl object-cover shadow-inner"
                  />
                ) : (
                  <div className={`w-12 h-12 ${getColor(user.username || "a")} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{user.username}</p>
                  <p className="text-xs text-slate-400 font-medium truncate">@{user.username}</p>
                </div>
              </div>
              <div className="shrink-0 flex justify-end">
              {sent.has(user.id) ? (
                <span className="text-xs text-slate-500 bg-slate-100 px-4 py-2 rounded-full font-bold">Terkirim ✓</span>
              ) : (
                <button onClick={() => sendRequest(user.id)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors">
                  + Tambah
                </button>
              )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <p className="mt-4 text-center text-sm font-medium text-slate-400">Pencarian tidak menemukan hasil</p>
      )}
    </div>
  )
}