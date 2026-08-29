'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useConversation, type Offer } from './useConversation'

const QUICK_REPLIES = ['Still available?', 'New offer']

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
    <div className="border-2 border-line rounded-[18px] p-4 bg-white text-center min-w-[190px] max-w-sm">
      <p className="font-mono text-[10px] tracking-[.08em] text-faint">OFFER</p>
      <p className="font-display text-2xl font-extrabold tracking-[-.03em] text-ink mt-0.5">
        ${Number(offer.amount).toFixed(2)}
      </p>

      {live && (
        <p className="text-xs text-muted mt-1">
          {timeLeft(offer.expires_at)}
        </p>
      )}

      {live && isSeller && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRespond('accept')}
            className="flex-1 py-2 bg-mint text-white rounded-xl font-display font-bold text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => onRespond('decline')}
            className="flex-1 py-2 border-2 border-line rounded-xl font-display font-bold text-sm"
          >
            Decline
          </button>
        </div>
      )}

      {live && !isSeller && (
        <p className="text-xs text-muted mt-2">Waiting on the seller…</p>
      )}

      {!live && (
        <p className="inline-block mt-2 rounded-full px-2.5 py-1 text-[11px] font-display font-bold">
          {offer.status === 'accepted' && (
            <span className="bg-[rgba(0,194,168,.14)] text-mint-dark rounded-full px-2.5 py-1">✓ Accepted</span>
          )}
          {offer.status === 'declined' && (
            <span className="bg-[rgba(255,90,31,.1)] text-orange-dark rounded-full px-2.5 py-1">✕ Declined</span>
          )}
          {(offer.status === 'expired' || (offer.status === 'pending' && expired)) && (
            <span className="bg-peach text-cocoa rounded-full px-2.5 py-1">⏰ Expired</span>
          )}
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

  if (loading) return <p className="p-6 text-muted">Loading…</p>

  const otherName = conversation
    ? conversation.sellerId === userId
      ? conversation.buyerName
      : conversation.sellerName
    : 'Chat'
  const role = conversation && conversation.sellerId === userId ? 'Selling' : 'Buying'

  const send = async () => {
    const body = draft
    setDraft('')
    try { await sendMessage(body) } catch (e) { alert((e as Error).message) }
  }

  const respond = async (offerId: string, action: 'accept' | 'decline') => {
    try { await respondToOffer(offerId, action) } catch (e) { alert((e as Error).message) }
  }

  return (
    <div className="flex flex-col h-dvh w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 p-4 border-b-2 border-line">
        <Link
          href="/chat"
          aria-label="Back to chats"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors shrink-0"
        >
          ←
        </Link>
        <div className="w-[38px] h-[38px] rounded-[12px] bg-cream overflow-hidden shrink-0">
          {conversation?.listingImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conversation.listingImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-[16px] text-ink truncate">{otherName}</p>
          <p className="text-[11px] font-medium text-muted truncate">
            {conversation?.listingTitle} · {role}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-[9px]">
        {messages.map(m => {
          if (m.kind === 'system') {
            return (
              <p key={m.id} className="text-center text-xs text-muted py-2">
                {m.body}
              </p>
            )
          }

          if (m.kind === 'offer' && m.offer_id && offers[m.offer_id]) {
            const offer = offers[m.offer_id]
            return (
              <div key={m.id} className="self-center">
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
              className={`max-w-[74%] px-3.5 py-2.5 text-[13.5px] leading-[1.45] ${
                mine
                  ? 'self-end rounded-[20px_20px_6px_20px] bg-orange text-white'
                  : 'self-start rounded-[20px_20px_20px_6px] bg-white border-2 border-line text-ink'
              }`}
            >
              {m.body}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t-2 border-line bg-cream">
        <div className="flex gap-1.5 mb-2.5">
          {QUICK_REPLIES.map(q => (
            <button
              key={q}
              onClick={() => setDraft(q)}
              className="bg-peach text-cocoa font-display font-bold text-[11.5px] px-3 py-1.5 rounded-full hover:bg-[#FFDCC0] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Message…"
            className="flex-1 border-2 border-line bg-white rounded-full px-4 py-2.5 outline-none focus:border-orange"
          />
          <button
            onClick={send}
            className="px-5 bg-ink text-white rounded-full font-display font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
