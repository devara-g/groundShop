"use client"

import { useState } from "react"
import Link from "next/link"
import SafeImage from "./SafeImage"

export default function ShopClient({ initialProducts }: { initialProducts: any[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("Paling Sesuai")

  const filteredProducts = initialProducts
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "Terbaru") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "Harga Terendah") return a.price_eth - b.price_eth
      return 0
    })

  return (
    <div className="flex-1 bg-slate-50/50 overflow-y-auto h-full pb-32 font-sans relative hide-scrollbar">
      {/* Search & Header Section */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md group">
            <input 
              type="text" 
              placeholder="Cari barang idamanmu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link 
              href="/main/shop/create" 
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Jual Barang
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 font-medium">
            Menampilkan <span className="text-slate-900 font-bold">{filteredProducts.length}</span> barang dari total untuk <span className="text-blue-600 font-bold">"{searchQuery || "Semua Produk"}"</span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Urutkan:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-hidden focus:ring-2 focus:ring-blue-500/10"
            >
              <option>Paling Sesuai</option>
              <option>Terbaru</option>
              <option>Harga Terendah</option>
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/main/shop/${product.id}`} className="group bg-white border border-slate-200/60 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative">
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <SafeImage src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">WEB3 READY</div>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-[13px] font-medium text-slate-800 line-clamp-2 leading-relaxed h-10 mb-1 group-hover:text-blue-600 transition-colors">{product.title}</h3>
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900">Ξ</span>
                      <span className="text-lg font-black text-slate-900 leading-none">{product.price_eth}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-0.5 text-orange-400">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        <span className="text-[11px] font-bold text-slate-600">{product.avgRating || "0"}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">|</span>
                      <span className="text-[11px] text-slate-500">Terjual {product.totalSold || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <div className="w-4 h-4 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <SafeImage src={product.profiles?.avatar_url} fallbackText={product.profiles?.username} isAvatar={true} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 truncate">{product.profiles?.username}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
            <h2 className="text-slate-800 font-black text-2xl mb-2">Tidak Ada Hasil</h2>
            <p className="text-slate-500">Coba kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>
    </div>
  )
}
