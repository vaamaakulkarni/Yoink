'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { DORMS, type Dorm } from '@/lib/dorms'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [university, setUniversity] = useState('University of Sydney')
  const [dorm, setDorm] = useState<Dorm>(DORMS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          university,
          dorm,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Successful signup -> straight to the feed
    router.push('/feed')
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] mb-1">
        Yoink<span className="text-[#FF5A1F]">.</span>
      </h1>
      <p className="text-sm text-[#8A8578] mb-8 font-medium">
        Where should we deliver the good stuff?
      </p>

      <form onSubmit={handleSignup} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-medium outline-none focus:border-[#FF5A1F]"
        />

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
          minLength={6}
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-medium outline-none focus:border-[#FF5A1F]"
        />

        <input
          type="text"
          placeholder="University"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-medium outline-none focus:border-[#FF5A1F]"
        />

        <select
          value={dorm}
          onChange={(e) => setDorm(e.target.value as Dorm)}
          className="rounded-2xl border-2 border-[#EFE6D8] px-4 py-3 text-sm font-semibold text-[#8A5A3A] outline-none focus:border-[#FF5A1F]"
        >
          {DORMS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF5A1F] text-white rounded-2xl py-3.5 font-display font-bold hover:bg-[#E64A0F] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-sm text-[#8A8578] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#FF5A1F] font-semibold">
          Log in
        </Link>
      </p>
    </main>
  )
}
