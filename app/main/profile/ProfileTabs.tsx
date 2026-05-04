"use client"

import { useState } from "react"
import PostList from "@/app/main/feed/postlist"

type ProfileTabsProps = {
  posts: any[]
}

export default function ProfileTabs({ posts }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"etalase" | "postingan" | "disimpan">("etalase")

  return (
    <div className="p-4">
      <div className="flex border-b border-slate-100 mb-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab("etalase")}
          className={`flex-1 py-3 text-sm font-bold min-w-[120px] transition-colors ${activeTab === "etalase" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Etalase Produk
        </button>
        <button 
          onClick={() => setActiveTab("postingan")}
          className={`flex-1 py-3 text-sm font-bold min-w-[120px] transition-colors ${activeTab === "postingan" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Postingan
        </button>
        <button 
          onClick={() => setActiveTab("disimpan")}
          className={`flex-1 py-3 text-sm font-bold min-w-[120px] transition-colors ${activeTab === "disimpan" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          Disimpan
        </button>
      </div>
      
      <div className="mt-4 pb-20">
        {activeTab === "etalase" && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-3xl">🛍️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada produk</h2>
            <p className="text-slate-500 text-sm">Etalase masih kosong. Tambahkan produk untuk mulai berjualan!</p>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:bg-blue-700 transition">
              + Tambah Produk
            </button>
          </div>
        )}

        {activeTab === "postingan" && (
          <PostList posts={posts} />
        )}

        {activeTab === "disimpan" && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔖</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum ada yang disimpan</h2>
            <p className="text-slate-500 text-sm">Simpan postingan atau produk menarik di sini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
