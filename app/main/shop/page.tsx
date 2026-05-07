import { createServerSupabase } from "@/lib/supabase/server"
import ShopClient from "./ShopClient"

export const revalidate = 0

export default async function ShopPage() {
  const supabase = await createServerSupabase()
  
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      profiles(username, avatar_url),
      product_reviews(rating)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-800 font-bold text-lg mb-2">Koneksi Database Terputus</p>
          <p className="text-sm text-slate-500">Gagal mengambil data produk.</p>
        </div>
      </div>
    )
  }

  const processedProducts = products?.map(p => {
    const reviews = p.product_reviews || []
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "0"
    return {
      ...p,
      avgRating,
      totalReviews: reviews.length,
      totalSold: reviews.length * 2 + 5
    }
  })

  return <ShopClient initialProducts={processedProducts || []} />
}
