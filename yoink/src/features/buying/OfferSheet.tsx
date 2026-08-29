'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface OfferSheetProps {
  item: {
    id: string
    title: string
    price: number
    seller_id: string
  }
  buyerId: string
  buyerName: string
  onClose: () => void
}

export default function OfferSheet({ item, buyerId, buyerName, onClose }: OfferSheetProps) {
  const [offerAmount, setOfferAmount] = useState<number | string>(item.price)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleQuickDiscount = (percentage: number) => {
    const discounted = (item.price * (1 - percentage)).toFixed(2)
    setOfferAmount(Number(discounted))
  }

  const handleSubmit = async () => {
    setLoading(true)
    const numericAmount = Number(offerAmount)

    // 1. Create row in matches table
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        listing_id: item.id,
        buyer_id: buyerId,
        seller_id: item.seller_id,
        offer_amount: numericAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (matchError || !matchData) {
      alert('Error making offer: ' + matchError?.message)
      setLoading(false)
      return
    }

    // 2. Insert auto-generated offer message into messages table
    const offerMessage = `${buyerName} offered $${numericAmount} for this. Accept, counter, or decline?`
    const { error: msgError } = await supabase.from('messages').insert({
      match_id: matchData.id,
      sender_id: buyerId,
      content: offerMessage,
    })

    setLoading(false)
    if (!msgError) {
      setSubmitted(true)
    } else {
      alert('Offer created, but failed to post message: ' + msgError.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 max-w-md w-full space-y-4">
        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <h3 className="text-xl font-bold text-emerald-600">Offer Sent! 🚀</h3>
            <p className="text-gray-600 text-sm">We&apos;ve notified the seller of your offer.</p>
            <button onClick={onClose} className="w-full py-2 bg-gray-900 text-white rounded-xl font-medium">
              Close
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-gray-500 font-medium">Try your luck 👀</p>
              <h2 className="text-xl font-bold">Make an Offer</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleQuickDiscount(0.1)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                10% off
              </button>
              <button
                onClick={() => handleQuickDiscount(0.15)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                15% off
              </button>
              <button
                onClick={() => handleQuickDiscount(0.2)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
              >
                20% off
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Custom Amount ($)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-lg font-bold mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="w-1/2 py-2.5 border rounded-xl font-medium">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Send Offer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}