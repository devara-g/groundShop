"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

type Profile = { id: string; username: string; avatar_url: string | null }
type Friend = {
  id: string
  requester_id: string
  addressee_id: string
  requester: Profile | null
  addressee: Profile | null
}

export default function FriendsList({ friends, currentUserId }: { friends: Friend[]; currentUserId: string }) {
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [starting, setStarting] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleRemove = async (id: string) => {
    if (!confirm("Hapus dari daftar teman?")) return
    await supabase.from("friendships").delete().eq("id", id)
    setRemoved(prev => new Set(prev).add(id))
    router.refresh()
  }

  const handleStartChat = async (friendId: string) => {
    setStarting(friendId)

    // Cek apakah sudah ada conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${currentUserId},participant_2.eq.${friendId}),` +
        `and(participant_1.eq.${friendId},participant_2.eq.${currentUserId})`
      )
      .single()

    if (existing) {
      router.push(`/main/chat/${existing.id}`)
      return
    }

    // Buat conversation baru
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ participant_1: currentUserId, participant_2: friendId })
      .select("id")
      .single()

    if (newConvo) router.push(`/main/chat/${newConvo.id}`)
    setStarting(null)
  }

  const visible = friends.filter(f => !removed.has(f.id))

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-slate-700 text-sm">Teman Aktif</h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-bold">{visible.length}</span>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm font-bold text-slate-500">Belum ada teman</p>
          <p className="text-xs mt-1">Cari dan tambah teman di sebelah kiri!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((friendship) => {
            const friend = friendship.requester_id === currentUserId
              ? friendship.addressee
              : friendship.requester
            if (!friend) return null

            return (
              <div key={friendship.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50 hover:border-blue-100 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getColor(friend.username)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner relative`}>
                    {friend.username[0].toUpperCase()}
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{friend.username}</p>
                    <p className="text-xs text-slate-400 font-medium">@{friend.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(friend.id)}
                    disabled={starting === friend.id}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {starting === friend.id ? "..." : "💬 Chat"}
                  </button>

                  <button onClick={() => handleRemove(friendship.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-red-500 bg-red-50 font-bold">
                    Hapus
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}