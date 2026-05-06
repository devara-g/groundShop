"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-indigo-50 to-sky-50">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform -rotate-6">
            <svg className="w-8 h-8 text-white transform rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buat Akun</h1>
          <p className="text-slate-500 mt-2 font-medium">Gabung dan mulai gunakan Dapshop</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-100 text-green-700 p-5 rounded-2xl mb-6 text-sm text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="font-bold text-lg mb-1">Registrasi berhasil!</p>
            <p className="font-medium">Cek email <strong>{email}</strong> dan klik link konfirmasi sebelum login.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                placeholder="johndoe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-200 flex justify-center items-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Buat Akun"}
            </button>
          </form>
        )}

        {!success && (
          <>
            <div className="my-8 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-slate-200 after:mt-0.5 after:flex-1 after:border-t after:border-slate-200">
              <p className="mx-4 mb-0 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                Atau
              </p>
            </div>

            <button
              onClick={async () => {
                setLoading(true)
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                })
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200 py-3.5 rounded-2xl font-bold hover:bg-slate-50 hover:shadow-md disabled:opacity-50 transition-all duration-200 mb-8"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Daftar dengan Google
            </button>
          </>
        )}

        <p className="text-center text-sm font-medium text-slate-500 mt-6">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}