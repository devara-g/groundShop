"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Status = "none" | "pending_sent" | "pending_received" | "friends" | "loading" | "done"

export default function AddFriendButton({
  targetUserId,
  currentUserId,
  initialStatus = "none",
  size = "sm",
}: {
  targetUserId: string
  currentUserId: string
  initialStatus?: Status
  size?: "sm" | "md"
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const supabase = createClient()
  const router = useRouter()

  const sendRequest = async () => {
    setStatus("loading")
    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: targetUserId,
      status: "pending",
    })
    if (error && error.message.includes("duplicate")) {
      setStatus("pending_sent")
    } else if (error) {
      setStatus("none")
    } else {
      setStatus("done")
      router.refresh()
    }
  }

  const btnBase = size === "sm"
    ? "px-3 py-1 rounded-full text-xs font-semibold transition"
    : "px-5 py-2 rounded-full text-sm font-semibold transition"

  if (status === "friends") return (
    <span className={`${btnBase} bg-gray-100 text-gray-500`}>✓ Teman</span>
  )
  if (status === "pending_sent" || status === "done") return (
    <span className={`${btnBase} bg-gray-100 text-gray-500`}>Terkirim</span>
  )
  if (status === "pending_received") return (
    <span className={`${btnBase} bg-yellow-100 text-yellow-700`}>Permintaan masuk</span>
  )
  if (status === "loading") return (
    <span className={`${btnBase} bg-blue-100 text-blue-400`}>...</span>
  )

  return (
    <button onClick={sendRequest} className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}>
      + Tambah Teman
    </button>
  )
}
