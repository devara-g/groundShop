import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next is the URL to redirect to after successful sign in
  const next = searchParams.get('next') ?? '/main/feed'

  if (code) {
    const supabase = await createServerSupabase()
    
    // Tukar kode rahasia dari Google menjadi sesi pengguna
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth exchange error:", error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      // Pastikan user ada di tabel profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
         console.error("Error checking profile:", profileError)
      }

      const fullName = data.user.user_metadata?.full_name
      const avatarUrl = data.user.user_metadata?.avatar_url

      if (!profile) {
        // Jika belum ada, buat baru
        const baseUsername = fullName ? fullName.replace(/\s+/g, '').toLowerCase() : (data.user.email?.split('@')[0] || 'user')
        const uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`
        
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: uniqueUsername,
          avatar_url: avatarUrl || null,
        })
        
        if (insertError) {
          console.error("Gagal membuat profile:", insertError)
        }
      } else if (!profile.avatar_url && avatarUrl) {
        // Jika sudah ada tapi belum punya foto, otomatis pasang foto dari Google
        const { error: updateError } = await supabase.from('profiles').update({
          avatar_url: avatarUrl
        }).eq('id', data.user.id)
        
        if (updateError) {
          console.error("Gagal update foto profile:", updateError)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal atau tidak ada kode
  console.error("No code found in URL or user data missing.")
  return NextResponse.redirect(`${origin}/auth/login?error=MissingCodeOrUser`)
}
