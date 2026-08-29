'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string
  title: string
  price: number
  image_url: string
  seller_name?: string
  ai_tag?: string
}

interface BasketEntry {
  id: string
  listings: Listing | Listing[] | null
}

export default function BasketPage() {
  const [items, setItems] = useState<BasketEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBasket() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('basket_items')
        .select('id, listings(id, title, price, image_url, seller_name, ai_tag)')
        .eq('buyer_id', user.id)

      if (!error && data) {
        setItems(data as unknown as BasketEntry[])
      }
      setLoading(false)
    }
    fetchBasket()
  }, [])

  async function handleRemove(entryId: string) {
    setRemovingId(entryId)
    const { error } = await supabase.from('basket_items').delete().eq('id', entryId)
    if (!error) {
      setItems((prev) => prev.filter((entry) => entry.id !== entryId))
    }
    setRemovingId(null)
  }

  if (loading) return <div className="p-8 text-center text-muted font-medium">Loading basket...</div>

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col p-6">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors"
        >
          ←
        </Link>
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xl font-display font-bold text-ink">
            Your basket&apos;s empty — go find some free drip.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors"
        >
          ←
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[-.03em] text-ink">Your Basket</h1>
      </div>
      <div className="space-y-3">
        {items.map((entry) => {
          const item = Array.isArray(entry.listings) ? entry.listings[0] : entry.listings
          if (!item) return null

          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-semibold text-ink">{item.title}</h3>
                  {item.ai_tag && (
                    <span className="bg-peach text-cocoa text-xs px-2 py-0.5 rounded-full font-display font-bold">
                      {item.ai_tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">
                  Seller: {item.seller_name || 'Anonymous'}
                </p>
                <p className="text-lg font-display font-extrabold text-orange mt-1">${item.price}</p>
              </div>
              <button
                onClick={() => handleRemove(entry.id)}
                disabled={removingId === entry.id}
                className="text-sm font-display font-bold text-orange-dark hover:text-orange disabled:opacity-50 px-3 py-1.5 rounded-xl border-2 border-line hover:border-orange transition-colors"
              >
                {removingId === entry.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}