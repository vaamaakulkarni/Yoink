'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Row = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listings: { title: string; price: number; image_url: string | null } | null
  messages: { body: string | null; created_at: string; kind: string }[]
}

export default function ChatListPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
          messages ( body, created_at, kind )
        `)
        .order('created_at', { ascending: false })

      setRows((data ?? []) as unknown as Row[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="p-6 text-[#8A8578]">Loading…</p>

  if (!rows.length) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
        <div className="p-10 text-center text-[#8A8578]">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No chats yet — make an offer to start one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-2">
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#1A1A1A]">Chats</h1>
      </div>

      {rows.map(c => {
        const last = [...(c.messages ?? [])]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .pop()
        const role = c.seller_id === userId ? 'Selling' : 'Buying'

        return (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="flex gap-3 items-center p-3 bg-white rounded-2xl border-2 border-[#EFE6D8] hover:border-[#FF5A1F] transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-[#F5F0E8] shrink-0 overflow-hidden">
              {c.listings?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.listings.image_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-baseline gap-2">
                <p className="font-display font-bold text-[#1A1A1A] truncate">
                  {c.listings?.title ?? 'Listing'}
                </p>
                <span className="text-[10px] font-bold text-[#8A8578] shrink-0">{role}</span>
              </div>
              <p className="text-sm text-[#8A8578] truncate">
                {last?.body ?? 'No messages yet'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}