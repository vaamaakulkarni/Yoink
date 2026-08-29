'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Draft = {
  category: string
  condition: string
  ai_tag: string | null
  condition_score: number | null
  photoPreview: string
}

export default function SellPricePage() {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [mode, setMode] = useState<'sell' | 'yoink'>('sell')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('yoink_draft')
    if (!stored) {
      // No draft found (e.g. page refreshed) — send them back to start over
      router.push('/sell')
      return
    }
    setDraft(JSON.parse(stored))
  }, [router])

  async function handlePost() {
    if (!draft) return
    if (!title.trim()) {
      setError('Give it a title first.')
      return
    }
    if (mode === 'sell' && (!price || Number(price) <= 0)) {
      setError('Enter a price, or switch to Yoink it for free.')
      return
    }

    setPosting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase.from('listings').insert({
      title,
      description,
      price: mode === 'sell' ? Number(price) : 0,
      is_free: mode === 'yoink',
      category: draft.category,
      condition: draft.condition,
      ai_tag: draft.ai_tag,
      image_url: draft.photoPreview, // NOTE: this is a temporary local blob URL — see note below
      seller_name: (user.user_metadata?.name as string) || 'A seller',
      dorm: (user.user_metadata?.dorm as string) || 'Queen Mary Building',
    })

    setPosting(false)

    if (insertError) {
      setError('Something went wrong posting your item: ' + insertError.message)
      return
    }

    sessionStorage.removeItem('yoink_draft')
    router.push('/feed')
  }

  if (!draft) return <p className="text-center py-10">Loading...</p>

  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-[#1A1A1A] mb-1">
        How&apos;s this leaving your hands?
      </h1>

      <div className="w-full max-w-xs mt-6">
        <div className="rounded-2xl overflow-hidden border-2 border-[#EFE6D8] mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.photoPreview} alt="Your item" className="w-full aspect-square object-cover" />
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 py-3 rounded-2xl font-display font-bold transition-colors ${
              mode === 'sell'
                ? 'bg-[#FF5A1F] text-white'
                : 'bg-white border-2 border-[#EFE6D8] text-[#1A1A1A]'
            }`}
          >
            Sell it 💰
          </button>
          <button
            onClick={() => setMode('yoink')}
            className={`flex-1 py-3 rounded-2xl font-display font-bold transition-colors ${
              mode === 'yoink'
                ? 'bg-[#00C2A8] text-white'
                : 'bg-white border-2 border-[#EFE6D8] text-[#1A1A1A]'
            }`}
          >
            Yoink it 🎁
          </button>
        </div>

        <label className="text-xs font-semibold text-[#8A8578]">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rice Cooker"
          className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2.5 text-sm font-medium mb-3 mt-1 outline-none focus:border-[#FF5A1F]"
        />

        <label className="text-xs font-semibold text-[#8A8578]">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any details buyers should know"
          rows={3}
          className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2.5 text-sm font-medium mb-3 mt-1 outline-none focus:border-[#FF5A1F]"
        />

        {mode === 'sell' && (
          <>
            <label className="text-xs font-semibold text-[#8A8578]">Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12"
              className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2.5 text-sm font-bold mb-4 mt-1 outline-none focus:border-[#FF5A1F]"
            />
          </>
        )}

        {error && <p className="text-sm text-red-500 font-medium mb-3">{error}</p>}

        <button
          onClick={handlePost}
          disabled={posting}
          className="w-full bg-[#FF5A1F] text-white rounded-2xl py-3.5 font-display font-bold hover:bg-[#E64A0F] transition-colors disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post it'}
        </button>
      </div>
    </main>
  )
}
