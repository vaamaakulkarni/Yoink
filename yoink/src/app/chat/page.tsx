'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Row = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listings: { title: string; price: number; image_url: string | null } | null
  messages: { body: string | null; created_at: string; kind: string }[]
  offers: { status: string; amount: number; created_at: string }[]
  buyer: { name: string } | null
  seller: { name: string } | null
}

const FILTERS = ['All', 'Buying', 'Selling'] as const

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { weekday: 'short' })
}

export default function ChatListPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { setLoading(false); return }
      setUserId(auth.user.id)

      const { data } = await supabase
        .from('conversations')
        .select(`
          id, listing_id, buyer_id, seller_id,
          listings ( title, price, image_url ),
          messages ( body, created_at, kind ),
          offers ( status, amount, created_at ),
          buyer:profiles!conversations_buyer_id_fkey(name),
          seller:profiles!conversations_seller_id_fkey(name)
        `)
        .order('created_at', { ascending: false })

      setRows((data ?? []) as unknown as Row[])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return rows
    return rows.filter(c =>
      filter === 'Selling' ? c.seller_id === userId : c.buyer_id === userId
    )
  }, [rows, filter, userId])

  if (loading) return <p className="p-6 text-muted">Loading…</p>

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <Link
        href="/feed"
        aria-label="Back to feed"
        className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors"
      >
        ←
      </Link>
      <h1 className="font-display text-2xl font-extrabold tracking-[-.03em] text-ink">Chats</h1>
    </div>
  )

  if (!rows.length) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        {header}
        <div className="p-10 text-center text-muted">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No chats yet — make an offer to start one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {header}

      <div className="flex gap-1.5 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-display font-bold transition-colors ${
              filter === f ? 'bg-ink text-cream' : 'bg-peach text-cocoa hover:bg-[#FFDCC0]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-[9px]">
        {filtered.map(c => {
          const last = [...(c.messages ?? [])]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .pop()
          const isSeller = c.seller_id === userId
          const role = isSeller ? 'Selling' : 'Buying'
          const otherName = isSeller ? c.buyer?.name : c.seller?.name

          const latestOffer = [...(c.offers ?? [])]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .pop()

          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex gap-3 items-center p-3 bg-white rounded-[22px] border-2 border-line hover:border-orange transition-colors"
            >
              <div className="w-[54px] h-[54px] rounded-[15px] bg-cream shrink-0 overflow-hidden">
                {c.listings?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.listings.image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-display font-bold text-[15px] text-ink truncate">
                    {c.listings?.title ?? 'Listing'}
                  </p>
                  <span
                    className={`shrink-0 font-display font-bold text-[9.5px] px-2 py-0.5 rounded-full ${
                      isSeller ? 'bg-peach text-cocoa' : 'bg-[rgba(0,194,168,.16)] text-mint-dark'
                    }`}
                  >
                    {role}
                  </span>
                </div>

                {latestOffer?.status === 'declined' && (
                  <p className="font-display font-bold text-[11.5px] text-orange-dark mt-1">✕ Offer declined.</p>
                )}
                {latestOffer?.status === 'accepted' && (
                  <p className="font-display font-bold text-[11.5px] text-mint-dark mt-1">
                    ✓ Offer accepted — ${Number(latestOffer.amount).toFixed(0)}
                  </p>
                )}

                <p className="text-xs text-muted truncate mt-0.5">
                  {last?.body ? `${otherName ?? '…'} · ${last.body}` : 'No messages yet'}
                </p>
              </div>
              {last && (
                <span className="shrink-0 font-mono text-[10px] text-faint">
                  {formatTimestamp(last.created_at)}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-5 pt-4 border-t-2 border-dashed border-line text-center">
        <p className="font-display font-bold text-sm text-ink">Nothing else on the go</p>
        <p className="text-xs text-muted mt-1">Chats start when you make an offer 👀</p>
      </div>
    </div>
  )
}
