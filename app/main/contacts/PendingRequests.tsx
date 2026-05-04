"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Request = {
  id: string
  requester_id: string
  status: string
  requester: { id: string; username: string; avatar_url: string | null } | null
}

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

export default function PendingRequests({
  requests,
  currentUserId,
}: {
  requests: Request[]
  currentUserId: string
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  const handleAccept = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id)
    setDismissed(prev => new Set(prev).add(id))
    router.refresh()
  }

  const handleReject = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id)
    setDismissed(prev => new Set(prev).add(id))
    router.refresh()
  }

  const visible = requests.filter(r => !dismissed.has(r.id))
  if (visible.length === 0) return null

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-slate-700 text-sm">Menunggu Konfirmasi</h3>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/30">{visible.length}</span>
      </div>
      <div className="space-y-3">
        {visible.map((req) => (
          <div key={req.id} className="flex items-center justify-between p-4 bg-white border border-slate-50 hover:border-orange-200 hover:shadow-md rounded-2xl transition-all group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${getColor(req.requester?.username || "a")} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                {req.requester?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-bold text-slate-800">{req.requester?.username}</p>
                <p className="text-xs text-slate-500">Ingin berteman</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleAccept(req.id)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-sm">
                Terima
              </button>
              <button onClick={() => handleReject(req.id)}
                className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition">
                Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}