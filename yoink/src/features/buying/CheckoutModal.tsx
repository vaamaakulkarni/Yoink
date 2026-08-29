'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CheckoutModalProps {
  item: {
    id: string
    title: string
    price: number
    image_url: string
    seller_id: string
    seller_name: string
  }
  buyerId: string
  onClose: () => void
}

export default function CheckoutModal({ item, buyerId, onClose }: CheckoutModalProps) {
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    const { error } = await supabase.from('matches').insert({
      listing_id: item.id,
      buyer_id: buyerId,
      seller_id: item.seller_id,
      offer_amount: null,
      status: 'pending',
    })

    setLoading(false)
    if (!error) {
      setIsSuccess(true)
    } else {
      alert('Error creating match: ' + error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border-2 border-[#EFE6D8]">
        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <h2 className="text-2xl font-display font-bold text-[#00C2A8]">You yoinked it! 🎉</h2>
            <p className="text-[#8A8578] font-medium">
              Message <span className="font-semibold text-[#1A1A1A]">{item.seller_name}</span> to arrange pickup.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 bg-[#1A1A1A] text-white rounded-2xl font-display font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-[#1A1A1A]">Checkout</h2>
            <div className="flex gap-4 items-center bg-[#FFF8F0] p-3 rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-xl" />
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{item.title}</h3>
                <p className="font-display font-bold text-lg text-[#FF5A1F]">${item.price}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8A8578] uppercase">Card Details (Mocked)</label>
              <input
                type="text"
                placeholder="4532 •••• •••• 8892"
                className="w-full border-2 border-[#EFE6D8] p-2 rounded-xl text-sm outline-none focus:border-[#FF5A1F]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-1/2 border-2 border-[#EFE6D8] p-2 rounded-xl text-sm outline-none focus:border-[#FF5A1F]"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="w-1/2 border-2 border-[#EFE6D8] p-2 rounded-xl text-sm outline-none focus:border-[#FF5A1F]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="w-1/2 py-2.5 border-2 border-[#EFE6D8] rounded-2xl font-display font-bold text-[#1A1A1A] hover:border-[#FF5A1F]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-1/2 py-2.5 bg-[#FF5A1F] text-white rounded-2xl font-display font-bold hover:bg-[#E64A0F] disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Buy Now — $${item.price}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
