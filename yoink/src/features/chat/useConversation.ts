'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Message = { id: string; conversation_id: string; sender_id: string | null; kind: 'text' | 'offer' | 'system'; body: string | null; offer_id: string | null; created_at: string }
export type Offer = { id: string; amount: number; status: 'pending' | 'accepted' | 'declined' | 'expired'; buyer_id: string; seller_id: string; expires_at: string }
export type ConversationInfo = { buyerId: string; sellerId: string; buyerName: string; sellerName: string; listingTitle: string; listingImage: string | null }

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [offers, setOffers] = useState<Record<string, Offer>>({})
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const load = useCallback(async () => {
    if (!conversationId) { setLoading(false); return }
    const [messageResult, offerResult, conversationResult] = await Promise.all([
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
      supabase.from('offers').select('*').eq('conversation_id', conversationId),
      supabase.from('conversations').select(`buyer_id, seller_id, buyer:profiles!conversations_buyer_id_fkey(name), seller:profiles!conversations_seller_id_fkey(name), listings ( title, image_url )`).eq('id', conversationId).single(),
    ])
    if (messageResult.data) setMessages(messageResult.data as Message[])
    if (offerResult.data) setOffers(Object.fromEntries((offerResult.data as Offer[]).map(offer => [offer.id, offer])))
    if (conversationResult.data) {
      const row = conversationResult.data as unknown as { buyer_id: string; seller_id: string; buyer: { name: string } | null; seller: { name: string } | null; listings: { title: string; image_url: string | null } | null }
      setConversation({ buyerId: row.buyer_id, sellerId: row.seller_id, buyerName: row.buyer?.name ?? 'Buyer', sellerName: row.seller?.name ?? 'Seller', listingTitle: row.listings?.title ?? 'Listing', listingImage: row.listings?.image_url ?? null })
    }
    setLoading(false)
  }, [conversationId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!conversationId) return
    const channel = supabase.channel(`conversation:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, ({ new: row }) => {
        const message = row as Message
        setMessages(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers', filter: `conversation_id=eq.${conversationId}` }, ({ new: row }) => {
        const offer = row as Offer
        setOffers(previous => ({ ...previous, [offer.id]: offer }))
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const sendMessage = useCallback(async (body: string) => {
    if (!conversationId || !userId || !body.trim()) return
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: userId, kind: 'text', body: body.trim() })
    if (error) throw new Error(error.message)
  }, [conversationId, userId])
  const respondToOffer = useCallback(async (offerId: string, action: 'accept' | 'decline') => {
    const { error } = await supabase.rpc('respond_to_offer', { p_offer_id: offerId, p_action: action })
    if (error) throw new Error(error.message)
  }, [])

  return { messages, offers, conversation, userId, loading, sendMessage, respondToOffer, reload: load }
}
