"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function EditProfileForm({ currentUsername }: { currentUsername: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState(currentUsername)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || username === currentUsername) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cek apakah username sudah dipakai
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single()

    if (existing) {
      setError("Username sudah dipakai orang lain")
      setLoading(false)
      return
    }

    // Update username
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id)

    if (updateErr) {
      setError("Gagal menyimpan perubahan")
    } else {
      setIsOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
      >
        Edit Profil
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Edit Profil</h2>
            
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="nama_toko_kamu"
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                <p className="text-slate-400 text-xs mt-2">Ini akan menjadi nama tokomu kelak.</p>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !username.trim()}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
