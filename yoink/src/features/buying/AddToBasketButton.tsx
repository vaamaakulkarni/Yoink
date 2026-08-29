'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddToBasketButtonProps {
  listingId: string
  buyerId: string
  size?: number
}

export default function AddToBasketButton({ listingId, buyerId, size = 52 }: AddToBasketButtonProps) {
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddToBasket = async () => {
    setLoading(true)
    const { error } = await supabase.from('basket_items').insert({
      buyer_id: buyerId,
      listing_id: listingId,
    })

    setLoading(false)
    if (!error) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } else {
      alert('Error adding to basket: ' + error.message)
    }
  }

  return (
    <button
      onClick={handleAddToBasket}
      disabled={loading || added}
      aria-label={added ? 'Added to basket' : 'Add to basket'}
      style={{ width: size }}
      className={`shrink-0 border-2 rounded-2xl flex items-center justify-center text-lg transition-colors ${
        added
          ? 'bg-mint border-mint text-white'
          : 'bg-white border-line hover:border-orange disabled:opacity-60'
      }`}
    >
      {added ? '✓' : '🧺'}
    </button>
  )
}
