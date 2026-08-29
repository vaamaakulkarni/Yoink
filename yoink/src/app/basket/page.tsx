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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading basket...</div>

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col p-6">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xl font-semibold text-gray-700">
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
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold">Your Basket</h1>
      </div>
      <div className="space-y-4">
        {items.map((entry) => {
          const item = Array.isArray(entry.listings) ? entry.listings[0] : entry.listings
          if (!item) return null

          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  {item.ai_tag && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.ai_tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Seller: {item.seller_name || 'Anonymous'}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">${item.price}</p>
              </div>
              <button
                onClick={() => handleRemove(entry.id)}
                disabled={removingId === entry.id}
                className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
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