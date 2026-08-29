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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <h2 className="text-2xl font-bold text-emerald-600">You yoinked it! 🎉</h2>
            <p className="text-gray-600">
              Message <span className="font-semibold text-gray-900">{item.seller_name}</span> to arrange pickup.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-gray-900 text-white rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Checkout</h2>
            <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl">
              <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
              <div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="font-bold text-lg">${item.price}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Card Details (Mocked)</label>
              <input
                type="text"
                placeholder="4532 •••• •••• 8892"
                className="w-full border p-2 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <input type="text" placeholder="MM/YY" className="w-1/2 border p-2 rounded-lg text-sm" />
                <input type="text" placeholder="CVC" className="w-1/2 border p-2 rounded-lg text-sm" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="w-1/2 py-2.5 border rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-1/2 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
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