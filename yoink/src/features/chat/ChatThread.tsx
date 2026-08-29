'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useConversation, type Offer } from './useConversation'

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const hrs = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`
}

function OfferCard({
  offer, isSeller, onRespond,
}: {
  offer: Offer
  isSeller: boolean
  onRespond: (action: 'accept' | 'decline') => void
}) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const expired = new Date(offer.expires_at).getTime() <= Date.now()
  const live = offer.status === 'pending' && !expired

  return (
    <div className="border-2 border-[#EFE6D8] rounded-2xl p-4 bg-white max-w-sm">
      <p className="text-2xl font-bold text-[#1A1A1A]">
        ${Number(offer.amount).toFixed(2)}
      </p>

      {live && (
        <p className="text-xs text-[#8A8578] mt-1">
          {timeLeft(offer.expires_at)}
        </p>
      )}

      {live && isSeller && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRespond('accept')}
            className="flex-1 py-2 bg-[#00C2A8] text-white rounded-xl font-bold text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => onRespond('decline')}
            className="flex-1 py-2 border-2 border-[#EFE6D8] rounded-xl font-bold text-sm"
          >
            Decline
          </button>
        </div>
      )}

      {live && !isSeller && (
        <p className="text-xs text-[#8A8578] mt-2">Waiting on the seller…</p>
      )}

      {!live && (
        <p className="text-sm font-semibold mt-2 text-[#8A8578]">
          {offer.status === 'accepted' && '✅ Accepted'}
          {offer.status === 'declined' && '❌ Declined'}
          {(offer.status === 'expired' || (offer.status === 'pending' && expired)) && '⏰ Expired'}
        </p>
      )}
    </div>
  )
}

export default function ChatThread({ conversationId }: { conversationId: string }) {
  const { messages, offers, conversation, userId, loading, sendMessage, respondToOffer } =
    useConversation(conversationId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading) return <p className="p-6 text-[#8A8578]">Loading…</p>

  const otherName = conversation
    ? conversation.sellerId === userId
      ? conversation.buyerName
      : conversation.sellerName
    : 'Chat'

  const send = async () => {
    const body = draft
    setDraft('')
    try { await sendMessage(body) } catch (e) { alert((e as Error).message) }
  }

  const respond = async (offerId: string, action: 'accept' | 'decline') => {
    try { await respondToOffer(offerId, action) } catch (e) { alert((e as Error).message) }
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 p-4 border-b-2 border-[#EFE6D8]">
        <Link
          href="/chat"
          aria-label="Back to chats"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
        <p className="font-display font-bold text-[#1A1A1A]">{otherName}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => {
          if (m.kind === 'system') {
            return (
              <p key={m.id} className="text-center text-xs text-[#8A8578] py-2">
                {m.body}
              </p>
            )
          }

          if (m.kind === 'offer' && m.offer_id && offers[m.offer_id]) {
            const offer = offers[m.offer_id]
            return (
              <div key={m.id} className={m.sender_id === userId ? 'ml-auto' : ''}>
                <OfferCard
                  offer={offer}
                  isSeller={offer.seller_id === userId}
                  onRespond={a => respond(offer.id, a)}
                />
              </div>
            )
          }

          const mine = m.sender_id === userId
          return (
            <div
              key={m.id}
              className={`max-w-xs px-4 py-2 rounded-2xl ${
                mine ? 'ml-auto bg-[#FF5A1F] text-white' : 'bg-[#F5F0E8] text-[#1A1A1A]'
              }`}
            >
              {m.body}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-4 border-t-2 border-[#EFE6D8]">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Message…"
          className="flex-1 border-2 border-[#EFE6D8] rounded-xl px-4 py-2 outline-none focus:border-[#FF5A1F]"
        />
        <button
          onClick={send}
          className="px-5 bg-[#1A1A1A] text-white rounded-xl font-bold"
        >
          Send
        </button>
      </div>
    </div>
  )
}