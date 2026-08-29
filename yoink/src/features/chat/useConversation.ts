'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  kind: 'text' | 'offer' | 'system'
  body: string | null
  offer_id: string | null
  created_at: string
}

export type Offer = {
  id: string
  amount: number
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  buyer_id: string
  seller_id: string
  expires_at: string
}

export type ConversationInfo = {
  buyerId: string
  sellerId: string
  buyerName: string
  sellerName: string
  listingTitle: string
  listingImage: string | null
}

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [offers, setOffers] = useState<Record<string, Offer>>({})
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const load = useCallback(async () => {
    if (!conversationId) return

    const [msgRes, offerRes] = await Promise.all([
      supabase.from('messages').select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      supabase.from('offers').select('*')
        .eq('conversation_id', conversationId),
    ])

    if (msgRes.data) setMessages(msgRes.data as Message[])
    if (offerRes.data) {
      setOffers(Object.fromEntries((offerRes.data as Offer[]).map(o => [o.id, o])))
    }
    setLoading(false)
  }, [conversationId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!conversationId) return
    supabase
      .from('conversations')
      .select(`
        buyer_id, seller_id,
        buyer:profiles!conversations_buyer_id_fkey(name),
        seller:profiles!conversations_seller_id_fkey(name),
        listings ( title, image_url )
      `)
      .eq('id', conversationId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const row = data as unknown as {
          buyer_id: string
          seller_id: string
          buyer: { name: string } | null
          seller: { name: string } | null
          listings: { title: string; image_url: string | null } | null
        }
        setConversation({
          buyerId: row.buyer_id,
          sellerId: row.seller_id,
          buyerName: row.buyer?.name ?? 'Buyer',
          sellerName: row.seller?.name ?? 'Seller',
          listingTitle: row.listings?.title ?? 'Listing',
          listingImage: row.listings?.image_url ?? null,
        })
      })
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        ({ new: row }) => {
          setMessages(prev =>
            prev.some(m => m.id === (row as Message).id)
              ? prev
              : [...prev, row as Message])
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'offers',
          filter: `conversation_id=eq.${conversationId}` },
        ({ new: row }) => {
          const o = row as Offer
          setOffers(prev => ({ ...prev, [o.id]: o }))
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const sendMessage = useCallback(async (body: string) => {
    if (!conversationId || !userId || !body.trim()) return
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      kind: 'text',
      body: body.trim(),
    })
    if (error) throw new Error(error.message)
  }, [conversationId, userId])

  const respondToOffer = useCallback(
    async (offerId: string, action: 'accept' | 'decline') => {
      const { error } = await supabase.rpc('respond_to_offer', {
        p_offer_id: offerId,
        p_action: action,
      })
      if (error) throw new Error(error.message)
    }, [])

  return { messages, offers, conversation, userId, loading, sendMessage, respondToOffer, reload: load }
}