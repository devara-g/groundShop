"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"

export default function CreateProductPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceEth, setPriceEth] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [stock, setStock] = useState("1")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("profiles").select("wallet_address").eq("id", user.id).single()
        if (data?.wallet_address) setWalletAddress(data.wallet_address)
      }
    }
    loadProfile()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast("Harus login dulu!", "error")
      setLoading(false)
      return
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      toast("Alamat dompet Metamask tidak valid. Harus dimulai dengan 0x dan panjang 42 karakter.", "error")
      setLoading(false)
      return
    }

    let finalImageUrl = ""

    // Upload image to Supabase Storage (using avatars bucket as generic public bucket)
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `products/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, imageFile)

      if (uploadError) {
        console.error("Gagal upload gambar:", uploadError)
        toast("Gagal mengunggah gambar. Pastikan format didukung dan ukuran kecil.", "error")
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
        
      finalImageUrl = publicUrl
    } else {
      toast("Wajib upload gambar barang!", "error")
      setLoading(false)
      return
    }

    // 1. Update wallet_address di profil user
    await supabase.from("profiles").update({ wallet_address: walletAddress }).eq("id", user.id)

    // 2. Simpan ke tabel products
    const { error } = await supabase.from("products").insert({
      seller_id: user.id,
      title,
      description,
      price_eth: parseFloat(priceEth),
      image_url: finalImageUrl,
      stock: parseInt(stock)
    })

    if (error) {
      console.error(error)
      toast("Gagal menambahkan barang: " + error.message, "error")
    } else {
      toast("Barang berhasil dijual! 🚀", "success")
      router.push("/main/shop")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900">Jual Barang Baru 📦</h1>
          <p className="text-slate-500 mt-1">Masukkan detail barang yang ingin kamu jual dengan Crypto.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
          
          {/* Upload Gambar Area */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Foto Barang</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/50 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors relative"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-blue-600">Klik untuk upload foto</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, max 5MB</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Barang</label>
            <input 
              required type="text" 
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Macbook Pro M3"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Harga (dalam ETH)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 320 512" fill="currentColor">
                    <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                  </svg>
                </div>
                <input 
                  required type="number" step="0.0001" min="0"
                  value={priceEth} onChange={(e) => setPriceEth(e.target.value)}
                  placeholder="0.05"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Stok</label>
              <input 
                required type="number" min="1"
                value={stock} onChange={(e) => setStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Barang</label>
            <textarea 
              required rows={4}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi, spesifikasi, dll..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Dompet Metamask Kamu (Penerima Dana)</label>
            <input 
              required type="text" 
              value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow" 
            />
            <p className="text-xs text-slate-500 mt-1">
              Uang jualanmu akan otomatis masuk ke dompet Ethereum ini.
            </p>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Posting Jualan"}
          </button>
        </form>
      </div>
    </div>
  )
}
