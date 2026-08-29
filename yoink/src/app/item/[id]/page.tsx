'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setItem(data as Listing)
        setLoading(false)
      })
  }, [id])

  if (loading) return <p className="text-center py-10">Loading...</p>
  if (!item) return <p className="text-center py-10">Item not found</p>

  return (
    <main className="max-w-2xl mx-auto p-4">
      <button onClick={() => router.back()} className="mb-4 text-sm text-gray-500">
        ← Back
      </button>

      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        )}
      </div>

      <h1 className="text-xl font-semibold">{item.title}</h1>
      <p className="text-lg text-gray-700 mb-1">
        {item.is_free ? 'FREE' : `$${item.price}`}
      </p>
      <p className="text-sm text-gray-500 mb-1">
        {item.category} · {item.condition}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        {item.seller_name} · {item.dorm}
      </p>
      <p className="text-sm text-gray-700 mb-6">{item.description}</p>

      {/* Frontend 2 wires real behavior into these buttons */}
      <div className="flex flex-col gap-2">
        <button className="bg-black text-white rounded-xl py-3 font-medium">
          {item.is_free ? 'Yoink It' : `Buy Now — $${item.price}`}
        </button>
        {!item.is_free && (
          <button className="border border-gray-300 rounded-xl py-3 font-medium">
            Make an Offer
          </button>
        )}
        <button className="border border-gray-300 rounded-xl py-3 font-medium">
          Add to Basket
        </button>
      </div>
    </main>
  )
}
