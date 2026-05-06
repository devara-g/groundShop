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
        .select('id, username, avatar_url')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
         console.error("Error checking profile:", profileError)
      }

      const fullName = data.user.user_metadata?.full_name
      const avatarUrl = data.user.user_metadata?.avatar_url
      const baseUsername = fullName ? fullName.replace(/\s+/g, '').toLowerCase() : (data.user.email?.split('@')[0] || 'user')
      const uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`

      if (!profile) {
        // Jika belum ada sama sekali, buat baru
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: uniqueUsername,
          avatar_url: avatarUrl || null,
        })
        
        if (insertError) {
          console.error("Gagal membuat profile:", insertError)
        }
      } else {
        // Jika sudah ada (mungkin terbuat oleh trigger DB), cek apakah username/avatar kosong
        const updates: any = {}
        if (!profile.username) {
          updates.username = uniqueUsername
        }
        if (!profile.avatar_url && avatarUrl) {
          updates.avatar_url = avatarUrl
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', data.user.id)
          if (updateError) {
            console.error("Gagal update foto/nama profile:", updateError)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal atau tidak ada kode
  console.error("No code found in URL or user data missing.")
  return NextResponse.redirect(`${origin}/auth/login?error=MissingCodeOrUser`)
}
