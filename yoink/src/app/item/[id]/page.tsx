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
  const [userDorm, setUserDorm] = useState<string>('Queen Mary Building')
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
        setUserDorm((user.user_metadata?.dorm as string) || 'Queen Mary Building')
      }
    })
  }, [id])

  if (loading) return <p className="text-center py-10 text-muted">Loading...</p>
  if (!item) return <p className="text-center py-10 text-muted">Item not found</p>

  // If somehow not logged in, send them to log in first rather than
  // letting them click a button that has no user to attach the action to
  const requireLogin = () => {
    if (!userId) {
      router.push('/login')
      return false
    }
    return true
  }

  const sellerInitial = (item.seller_name ?? '?').charAt(0).toUpperCase()
  const sameBuilding = !!item.dorm && item.dorm === userDorm

  const chips = (
    <div className="flex gap-1.5">
      {item.category && (
        <span className="bg-peach text-cocoa font-display font-bold text-[11px] px-2.5 py-1.5 rounded-full">
          {item.category}
        </span>
      )}
      {item.condition && (
        <span className="bg-peach text-cocoa font-display font-bold text-[11px] px-2.5 py-1.5 rounded-full">
          {item.condition}
        </span>
      )}
    </div>
  )

  const sellerCard = (
    <div className="flex items-center gap-3 bg-white border-2 border-line rounded-[20px] p-3">
      <div className="w-[42px] h-[42px] rounded-full bg-peach shrink-0 flex items-center justify-center font-display font-extrabold text-[15px] text-cocoa">
        {sellerInitial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-ink truncate">{item.seller_name}</p>
        <p className="text-[11.5px] font-medium text-muted mt-0.5 truncate">{item.dorm}</p>
      </div>
      {sameBuilding && (
        <span className="shrink-0 bg-[rgba(0,194,168,.14)] text-mint-dark font-display font-bold text-[10.5px] px-2.5 py-1.5 rounded-full">
          Same building
        </span>
      )}
    </div>
  )

  const description = (
    <p className="text-[13.5px] leading-[1.7] text-[rgba(26,26,26,.75)]">{item.description}</p>
  )

  const actions = (loggedIn: boolean, priceLabel: string) => (
    <>
      <div className="flex gap-2 items-stretch">
        {!item.is_free && (
          <button
            onClick={() => requireLogin() && setShowOffer(true)}
            className="flex-1 border-2 border-line bg-white rounded-2xl py-3 text-center font-display font-bold text-sm hover:border-orange transition-colors"
          >
            Make an Offer
          </button>
        )}
        {loggedIn && <AddToBasketButton listingId={item.id} buyerId={userId!} />}
      </div>
      <button
        onClick={() => requireLogin() && setShowCheckout(true)}
        className="yk-shadow-orange w-full bg-orange text-white rounded-2xl py-3.5 font-display font-extrabold text-[15px] transition-transform"
      >
        {item.is_free ? 'Yoink It 🎁' : priceLabel}
      </button>
    </>
  )

  const priceLabel = item.is_free ? 'FREE' : `Buy Now — $${item.price}`

  return (
    <main className="min-h-screen">
      {/* Mobile */}
      <div className="lg:hidden pb-40">
        <div className="h-[300px] bg-cream overflow-hidden relative">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          )}
          <button
            onClick={() => router.back()}
            className="absolute top-12 left-4 bg-[rgba(255,248,240,.94)] rounded-full px-3.5 py-2 font-display font-bold text-[12.5px] text-ink"
          >
            ← Back
          </button>
        </div>

        <div className="-mt-[26px] relative rounded-t-[28px] bg-cream px-4 pt-4 space-y-3">
          {chips}
          <h1 className="font-display text-[27px] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">
            {item.title}
          </h1>
          <p className="font-display text-[34px] font-extrabold tracking-[-.035em] text-orange leading-none">
            {item.is_free ? 'FREE' : `$${item.price}`}
          </p>
          {sellerCard}
          {description}
        </div>

        <div className="fixed left-0 right-0 bottom-0 bg-cream border-t-2 border-line px-4 pt-3 pb-5 flex flex-col gap-2 z-20">
          {actions(!!userId, priceLabel)}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid max-w-5xl mx-auto px-6 py-8 grid-cols-[1.05fr_1fr] gap-[34px] items-start">
        <div className="aspect-[4/3] rounded-3xl border-2 border-line bg-cream overflow-hidden">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          )}
        </div>

        <div>
          <button
            onClick={() => router.back()}
            className="bg-white border-2 border-line rounded-full px-3.5 py-2 font-display font-bold text-[12.5px] text-ink hover:border-orange transition-colors mb-4"
          >
            ← Back
          </button>
          <div className="mb-3">{chips}</div>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-[-.035em] text-ink">
            {item.title}
          </h1>
          <p className="font-display text-[44px] font-extrabold tracking-[-.04em] text-orange leading-none mt-2">
            {item.is_free ? 'FREE' : `$${item.price}`}
          </p>
          <div className="mt-4 max-w-[420px]">{description}</div>
          <div className="mt-5 max-w-[420px]">{sellerCard}</div>
          <div className="mt-[18px] max-w-[420px] flex gap-2.5 items-stretch">
            <button
              onClick={() => requireLogin() && setShowCheckout(true)}
              className="yk-shadow-orange flex-1 bg-orange text-white rounded-2xl py-3.5 text-center font-display font-extrabold text-[15px] transition-transform"
            >
              {item.is_free ? 'Yoink It 🎁' : priceLabel}
            </button>
            {!item.is_free && (
              <button
                onClick={() => requireLogin() && setShowOffer(true)}
                className="border-2 border-line bg-white rounded-2xl px-5 font-display font-bold text-sm hover:border-orange transition-colors"
              >
                Make an Offer
              </button>
            )}
            {userId && <AddToBasketButton listingId={item.id} buyerId={userId} size={54} />}
          </div>
        </div>
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
