import { createServerSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  
  revalidatePath("/", "layout")
  return NextResponse.redirect(new URL("/auth/login", req.url), { status: 302 })
}