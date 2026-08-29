'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/feed')
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] mb-1">
        Yoink<span className="text-[#FF5A1F]">.</span>
      </h1>
      <p className="text-sm text-[#8A8578] mb-8 font-medium">
        Welcome back.
      </p>

      <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-medium outline-none focus:border-[#FF5A1F]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-medium outline-none focus:border-[#FF5A1F]"
        />

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF5A1F] text-white rounded-2xl py-3.5 font-display font-bold hover:bg-[#E64A0F] transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-sm text-[#8A8578] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#FF5A1F] font-semibold">
          Sign up
        </Link>
      </p>
    </main>
  )
}
