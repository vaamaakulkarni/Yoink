'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useConversation, type Offer } from './useConversation'

function OfferCard({ offer, isSeller, onRespond }: { offer: Offer; isSeller: boolean; onRespond: (action: 'accept' | 'decline') => void }) {
  const expired = new Date(offer.expires_at).getTime() <= Date.now()
  const live = offer.status === 'pending' && !expired
  return <div className="border-2 border-line rounded-[18px] p-4 bg-white text-center min-w-[190px]"><p className="font-mono text-[10px] tracking-[.08em] text-faint">OFFER</p><p className="font-display text-2xl font-extrabold text-ink">${Number(offer.amount).toFixed(2)}</p>{live && isSeller && <div className="flex gap-2 mt-3"><button onClick={() => onRespond('accept')} className="flex-1 py-2 bg-mint text-white rounded-xl font-bold text-sm">Accept</button><button onClick={() => onRespond('decline')} className="flex-1 py-2 border-2 border-line rounded-xl font-bold text-sm">Decline</button></div>}{live && !isSeller && <p className="text-xs text-muted mt-2">Waiting on the seller…</p>}{!live && <p className="text-xs text-muted mt-2">{offer.status === 'accepted' ? '✓ Accepted' : offer.status === 'declined' ? '✕ Declined' : '⏰ Expired'}</p>}</div>
}

export default function ChatThread({ conversationId }: { conversationId: string }) {
  const { messages, offers, conversation, userId, loading, sendMessage, respondToOffer } = useConversation(conversationId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])
  if (loading) return <p className="p-6 text-muted">Loading…</p>
  const isSeller = conversation?.sellerId === userId
  const send = async () => { const body = draft; setDraft(''); try { await sendMessage(body) } catch (error) { alert((error as Error).message) } }
  return <div className="flex flex-col h-dvh w-full max-w-2xl mx-auto"><header className="flex items-center gap-3 p-4 border-b-2 border-line"><Link href="/chat" aria-label="Back to chats" className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg">←</Link><div className="min-w-0"><p className="font-display font-bold text-[16px] text-ink truncate">{isSeller ? conversation?.buyerName : conversation?.sellerName}</p><p className="text-[11px] font-medium text-muted truncate">{conversation?.listingTitle ?? 'Listing'} · {isSeller ? 'Selling' : 'Buying'}</p></div></header><div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">{messages.map(message => { if (message.kind === 'system') return <p key={message.id} className="text-center text-xs text-muted py-2">{message.body}</p>; if (message.kind === 'offer' && message.offer_id && offers[message.offer_id]) { const offer = offers[message.offer_id]; return <div key={message.id} className="self-center"><OfferCard offer={offer} isSeller={offer.seller_id === userId} onRespond={action => respondToOffer(offer.id, action).catch(error => alert(error.message))} /></div> }; const mine = message.sender_id === userId; return <div key={message.id} className={`max-w-[74%] px-3.5 py-2.5 text-sm ${mine ? 'self-end rounded-[20px_20px_6px_20px] bg-orange text-white' : 'self-start rounded-[20px_20px_20px_6px] bg-white border-2 border-line text-ink'}`}>{message.body}</div> })}<div ref={bottomRef} /></div><footer className="flex gap-2 p-4 border-t-2 border-line bg-cream"><input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') send() }} placeholder="Message…" className="flex-1 border-2 border-line bg-white rounded-full px-4 py-2.5 outline-none focus:border-orange" /><button onClick={send} className="px-5 bg-ink text-white rounded-full font-bold">Send</button></footer></div>
}
