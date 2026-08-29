'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import AddToBasketButton from '@/features/buying/AddToBasketButton'
import OfferSheet from '@/features/buying/OfferSheet'
import CheckoutModal from '@/features/buying/CheckoutModal'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('A buyer')
  const [showOffer, setShowOffer] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

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

    // Get the currently logged-in user, needed for basket/offer/checkout
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setUserName((user.user_metadata?.name as string) || 'A buyer')
      }
    })
  }, [id])

  if (loading) return <p className="text-center py-10">Loading...</p>
  if (!item) return <p className="text-center py-10">Item not found</p>

  // If somehow not logged in, send them to log in first rather than
  // letting them click a button that has no user to attach the action to
  const requireLogin = () => {
    if (!userId) {
      router.push('/login')
      return false
    }
    return true
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <button onClick={() => router.back()} className="mb-4 text-sm text-[#8A8578] font-medium">
        ← Back
      </button>

      <div className="aspect-square bg-[#FFF8F0] rounded-3xl overflow-hidden mb-4 border-2 border-[#EFE6D8]">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        )}
      </div>

      <h1 className="text-xl font-display font-bold text-[#1A1A1A]">{item.title}</h1>
      <p className="text-lg font-display font-bold text-[#FF5A1F] mb-1">
        {item.is_free ? 'FREE' : `$${item.price}`}
      </p>
      <p className="text-sm text-[#8A8578] font-medium mb-1">
        {item.category} · {item.condition}
      </p>
      <p className="text-sm text-[#8A8578] font-medium mb-4">
        {item.seller_name} · {item.dorm}
      </p>
      <p className="text-sm text-[#1A1A1A] mb-6">{item.description}</p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => requireLogin() && setShowCheckout(true)}
          className="bg-[#FF5A1F] text-white rounded-2xl py-3 font-display font-bold hover:bg-[#E64A0F] transition-colors"
        >
          {item.is_free ? 'Yoink It' : `Buy Now — $${item.price}`}
        </button>

        {!item.is_free && (
          <button
            onClick={() => requireLogin() && setShowOffer(true)}
            className="border-2 border-[#EFE6D8] text-[#1A1A1A] rounded-2xl py-3 font-display font-bold hover:border-[#FF5A1F] transition-colors"
          >
            Make an Offer
          </button>
        )}

        {userId && <AddToBasketButton listingId={item.id} buyerId={userId} />}
      </div>

      {showCheckout && userId && (
        <CheckoutModal
          item={{
            id: item.id,
            title: item.title,
            price: item.price ?? 0,
            image_url: item.image_url ?? '',
            seller_id: item.seller_name ?? '', // TODO: replace with real seller_id column once sellers are tied to auth users
            seller_name: item.seller_name ?? 'the seller',
          }}
          buyerId={userId}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {showOffer && userId && (
        <OfferSheet
          item={{
            id: item.id,
            title: item.title,
            price: item.price ?? 0,
            seller_id: item.seller_name ?? '', // TODO: same as above
          }}
          buyerId={userId}
          buyerName={userName}
          onClose={() => setShowOffer(false)}
        />
      )}
    </main>
  )
}
