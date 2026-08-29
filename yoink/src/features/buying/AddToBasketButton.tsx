'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddToBasketButtonProps {
  listingId: string
  buyerId: string
}

export default function AddToBasketButton({ listingId, buyerId }: AddToBasketButtonProps) {
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
      className={`w-full py-3 rounded-2xl font-display font-bold transition-all duration-200 ${
        added
          ? 'bg-[#00C2A8] text-white scale-105'
          : 'bg-[#FFE8D6] text-[#8A5A3A] hover:bg-[#FFDCC0]'
      }`}
    >
      {loading ? 'Adding...' : added ? '✓ Added to Basket!' : 'Add to Basket'}
    </button>
  )
}
