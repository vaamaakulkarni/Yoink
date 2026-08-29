'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    async function fetchBasket() {
      const { data, error } = await supabase
        .from('basket_items')
        .select('id, listings(id, title, price, image_url, seller_name, ai_tag)')

      if (!error && data) {
        setItems(data as unknown as BasketEntry[])
      }
      setLoading(false)
    }

    fetchBasket()
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Loading basket...</div>

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <p className="text-xl font-semibold text-gray-700">
          Your basket&apos;s empty — go find some free drip.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Basket</h1>
      <div className="space-y-4">
        {items.map((entry) => {
          const item = Array.isArray(entry.listings) ? entry.listings[0] : entry.listings
          if (!item) return null

          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
            >
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
            </div>
          )
        })}
      </div>
    </div>
  )
}