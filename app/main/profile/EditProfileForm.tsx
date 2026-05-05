"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"


export default function EditProfileForm({
  currentUsername,
  currentAvatarUrl,
}: {
  currentUsername: string
  currentAvatarUrl?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState(currentUsername)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let avatarUrl = currentAvatarUrl ?? null

    // Upload avatar kalau ada file baru
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true })

      if (uploadErr) {
        setError("Gagal upload foto: " + uploadErr.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      // Simpan URL dengan cache buster (?v=timestamp) ke DB agar CDN Vercel & browser 
      // tidak menampilkan gambar lama (cached) saat foto diganti
      avatarUrl = `${publicUrl}?v=${Date.now()}`
      setAvatarPreview(avatarUrl)
    }

    // Cek apakah username sudah dipakai (kalau berubah)
    if (username !== currentUsername) {
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
    }

    // Update profil
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ username, avatar_url: avatarUrl })
      .eq("id", user.id)

    if (updateErr) {
      setError("Gagal menyimpan: " + updateErr.message)
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
        className="w-full px-4 py-1.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors text-[14px]"
      >
        Edit Profil
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Edit Profil</h2>

            <form onSubmit={handleSave}>
              {/* Avatar upload */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="relative w-24 h-24 rounded-full cursor-pointer group"
                  onClick={() => fileRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-4xl">
                      {username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Ganti Foto</span>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-slate-400 text-xs mt-2">Klik foto untuk menggantinya</p>
              </div>

              {/* Username */}
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
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setAvatarFile(null); setAvatarPreview(currentAvatarUrl ?? null) }}
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
