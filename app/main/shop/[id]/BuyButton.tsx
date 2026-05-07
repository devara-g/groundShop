"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"

export default function BuyButton({ product, currentUserId, sellerWallet }: { product: any, currentUserId: string | null, sellerWallet: string | null }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleBuy = async () => {
    if (!currentUserId) return toast("Login dulu bro!", "error")
    if (currentUserId === product.seller_id) return toast("Masa beli barang jualan sendiri wkwk", "error")
    if (!sellerWallet) return toast("Penjual belum mendaftarkan dompet crypto-nya.", "error")

    try {
      setLoading(true)

      // 1. Cek apakah Metamask (atau dompet Web3 lain) tersedia di browser
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error("Metamask tidak terdeteksi! Silakan install ekstensi Metamask dulu.")
      }

      const ethereum = (window as any).ethereum

      // 2. Request izin untuk memakai akun Metamask pengguna
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const buyerAccount = accounts[0]

      // 3. Konversi ETH ke Wei (Hexadecimal) untuk standard format Ethereum
      // 1 ETH = 10^18 Wei
      const weiValue = BigInt(Math.floor(product.price_eth * 1e18))
      const hexValue = '0x' + weiValue.toString(16)

      // 4. Minta Metamask mengirim transaksi
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: buyerAccount,
            to: sellerWallet,
            value: hexValue,
          },
        ],
      })

      // 5. Kalau sukses dikirim, catat di database kita
      const { error } = await supabase.from("orders").insert({
        product_id: product.id,
        buyer_id: currentUserId,
        seller_id: product.seller_id,
        tx_hash: txHash,
        amount_eth: product.price_eth
      })

      if (error) throw error

      // 6. Update stok barang
      await supabase.from("products").update({ stock: product.stock - 1 }).eq("id", product.id)
      
      setSuccess(true)
      toast(`Transaksi Berhasil! 🎉 Hash: ${txHash}`, "success")
      router.refresh()

    } catch (err: any) {
      console.error(err)
      toast(err.message || "Transaksi gagal atau dibatalkan oleh user.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <button disabled className="w-full bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Pembayaran Berhasil!
      </button>
    )
  }

  return (
    <button 
      onClick={handleBuy} 
      disabled={loading || product.stock <= 0}
      className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${
        product.stock <= 0 
          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-[#F6851B] hover:bg-[#E2761B] text-white shadow-orange-500/20"
      }`}
    >
      <svg className="w-6 h-6" viewBox="0 0 320 512" fill="currentColor">
        <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
      </svg>
      {loading ? "Menunggu Konfirmasi Metamask..." : product.stock <= 0 ? "Stok Habis" : "Beli dengan Metamask"}
    </button>
  )
}
