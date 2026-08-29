'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
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

  const { data, error } = await supabase.rpc('make_offer', {
    p_listing_id: item.id,
    p_amount: numericAmount,
  })

  setLoading(false)

  if (error) {
    alert(error.message)
    return
  }

  router.push(`/chat/${data.conversation_id}`)
}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4 border-2 border-[#EFE6D8]">
        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <h3 className="text-xl font-display font-bold text-[#00C2A8]">Offer Sent! 🚀</h3>
            <p className="text-[#8A8578] text-sm font-medium">
              We&apos;ve notified the seller of your offer.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-2xl font-display font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-[#8A8578] font-medium">Try your luck 👀</p>
              <h2 className="text-xl font-display font-bold text-[#1A1A1A]">Make an Offer</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleQuickDiscount(0.1)}
                className="flex-1 py-2 bg-[#FFE8D6] hover:bg-[#FFDCC0] rounded-xl text-sm font-display font-semibold text-[#8A5A3A]"
              >
                10% off
              </button>
              <button
                onClick={() => handleQuickDiscount(0.15)}
                className="flex-1 py-2 bg-[#FFE8D6] hover:bg-[#FFDCC0] rounded-xl text-sm font-display font-semibold text-[#8A5A3A]"
              >
                15% off
              </button>
              <button
                onClick={() => handleQuickDiscount(0.2)}
                className="flex-1 py-2 bg-[#FFE8D6] hover:bg-[#FFDCC0] rounded-xl text-sm font-display font-semibold text-[#8A5A3A]"
              >
                20% off
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8A8578]">Custom Amount ($)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full border-2 border-[#EFE6D8] p-2.5 rounded-xl text-lg font-bold mt-1 outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="w-1/2 py-2.5 border-2 border-[#EFE6D8] rounded-2xl font-display font-bold text-[#1A1A1A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-1/2 py-2.5 bg-[#FF5A1F] text-white rounded-2xl font-display font-bold hover:bg-[#E64A0F] disabled:opacity-50"
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
