"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"

export default function ReviewForm({ productId, userId }: { productId: string, userId: string | null }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  if (!userId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        comment
      })

    setLoading(false)

    if (error) {
      if (error.code === "23505") {
        toast("Lu udah pernah kasih ulasan buat barang ini bang!", "error")
      } else {
        toast("Gagal kirim ulasan: " + error.message, "error")
      }
    } else {
      toast("Ulasan berhasil dikirim! Makasih bang.", "success")
      setComment("")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10">
      <h3 className="font-black text-slate-900 mb-4 uppercase tracking-wider text-sm">Kasih Ulasan Lu Bang</h3>
      
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <svg 
              className={`w-8 h-8 ${star <= rating ? "text-orange-400" : "text-slate-200"} fill-current hover:scale-110 transition-transform`} 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tulis ulasan lu di sini..."
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden min-h-[100px] mb-4"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  )
}
