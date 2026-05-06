import { createServerSupabase } from "@/lib/supabase/server"
import Link from "next/link"
import BuyButton from "@/app/main/shop/[id]/BuyButton"
import SafeImage from "../SafeImage"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { id } = await params
  
  const { data: product, error } = await supabase
    .from("products")
    .select("*, profiles(username, avatar_url, wallet_address)")
    .eq("id", id)
    .single()

  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <p className="text-slate-800 font-black text-2xl mb-2">Produk tidak ditemukan 😢</p>
          <p className="text-slate-500 font-medium mb-6">Mungkin sudah dihapus atau ID tidak valid.</p>
          <Link href="/main/shop" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
            Kembali ke Toko
          </Link>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex-1 bg-[#FAFAFA] overflow-y-auto p-4 md:p-8 relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <Link href="/main/shop" className="group inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-8 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Kembali ke Toko
        </Link>

        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          {/* Gambar Produk */}
          <div className="w-full lg:w-1/2">
            <div className="aspect-square rounded-[2rem] overflow-hidden bg-white border-4 border-white shadow-2xl shadow-indigo-100 relative group">
              <SafeImage 
                src={product.image_url} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20 shadow-xl flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 320 512" fill="currentColor">
                  <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                </svg>
                Verified Web3 Item
              </div>
            </div>
          </div>

          {/* Info Produk */}
          <div className="w-full lg:w-1/2 flex flex-col py-2">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black tracking-wider uppercase mb-4 border border-indigo-100">
                Stok Tersedia: {product.stock}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {product.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Harga Pembelian</p>
                <div className="flex items-end gap-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  <span>{product.price_eth}</span>
                  <span className="text-2xl mb-1 text-slate-500">ETH</span>
                </div>
              </div>
            </div>

            {/* Info Penjual */}
            <div className="flex items-center gap-4 p-5 bg-white border border-slate-200/60 rounded-3xl mb-8 shadow-sm hover:shadow-md transition-shadow">
              <SafeImage 
                src={product.profiles?.avatar_url}
                fallbackText={product.profiles?.username}
                isAvatar={true}
                className="w-14 h-14 rounded-full shadow-md object-cover border-2 border-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Dijual oleh</p>
                <p className="font-black text-slate-900 text-lg truncate">{product.profiles?.username}</p>
                {product.profiles?.wallet_address ? (
                  <p className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md inline-block mt-1 truncate max-w-full">
                    {product.profiles.wallet_address}
                  </p>
                ) : (
                  <p className="text-[11px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md inline-block mt-1">Belum set dompet crypto</p>
                )}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Deskripsi Produk
              </h3>
              <div className="prose prose-slate max-w-none text-slate-600 bg-white p-6 rounded-3xl border border-slate-100 leading-relaxed shadow-sm">
                {product.description || "Tidak ada deskripsi."}
              </div>
            </div>

            {/* Aksi */}
            <div className="mt-auto sticky bottom-4 z-20">
              <BuyButton 
                product={product} 
                currentUserId={user?.id || null} 
                sellerWallet={product.profiles?.wallet_address}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
