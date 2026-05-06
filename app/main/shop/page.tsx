import { createServerSupabase } from "@/lib/supabase/server"
import Link from "next/link"
import SafeImage from "./SafeImage"

export default async function ShopPage() {
  const supabase = await createServerSupabase()
  
  // Ambil semua produk
  const { data: products, error } = await supabase
    .from("products")
    .select("*, profiles(username, avatar_url)")
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 bg-[#FAFAFA] overflow-y-auto h-full p-4 md:p-8 pb-32 font-sans relative">
      {/* Decorative Background Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Web3 Market <span className="text-4xl">💎</span>
          </h1>
          <p className="text-base text-slate-500 mt-2 font-medium">Beli barang idaman pakai Ethereum, desentralisasi tanpa batas.</p>
        </div>
        <Link 
          href="/main/shop/create" 
          className="group relative inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-500 skew-x-12"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative z-10">Jual Barang</span>
        </Link>
      </div>

      {/* Grid Produk */}
      {error ? (
        <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20">
          <p className="text-slate-800 font-bold text-lg mb-2">Koneksi Database Terputus</p>
          <p className="text-sm text-slate-500">Pastikan tabel products sudah dibuat di Supabase.</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/main/shop/${product.id}`} className="group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <SafeImage 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                
                {/* Badge ETH */}
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                  <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 320 512" fill="currentColor">
                    <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                  </svg>
                  ETH
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 text-lg line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
                
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Harga</p>
                    <div className="flex items-center gap-1.5 font-black text-slate-900 text-2xl">
                      <span>{product.price_eth}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                    <SafeImage 
                      src={product.profiles?.avatar_url} 
                      fallbackText={product.profiles?.username}
                      isAvatar={true}
                      className="w-6 h-6 rounded-full object-cover shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-600 truncate max-w-[80px]">{product.profiles?.username}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-slate-800 font-black text-2xl mb-2">Toko Masih Kosong</h2>
          <p className="text-slate-500 font-medium max-w-sm">Belum ada barang yang dijual nih. Jadilah yang pertama cuan pakai Crypto!</p>
        </div>
      )}
    </div>
  )
}
