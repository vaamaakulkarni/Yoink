'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Listing } from '@/lib/types'
import { Filters } from './FilterSheet'

export function useListings(
  category: string,
  search: string,
  filters: Filters
) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let query = supabase.from('listings').select('*')

    if (category === 'Free') {
      query = query.eq('is_free', true)
    } else if (category !== 'All') {
      query = query.eq('category', category)
    }

    if (search.trim() !== '') {
      // ILIKE = case-insensitive partial match against real data.
      // Checks title OR category so "kitchenware" and "rice cooker" both work.
      query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`)
    }

    query = query.lte('price', filters.maxPrice)

    if (filters.yoinkStatus === 'first') {
      query = query.eq('is_reyoink', false)
    } else if (filters.yoinkStatus === 'reyoink') {
      query = query.eq('is_reyoink', true)
    }

    if (filters.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (filters.sortBy === 'price_low') {
      query = query.order('price', { ascending: true })
    } else if (filters.sortBy === 'price_high') {
      query = query.order('price', { ascending: false })
    }

    setLoading(true)
    query.then(({ data, error }) => {
      if (error) {
        console.error('Error fetching listings:', error)
      } else {
        setListings(data as Listing[])
      }
      setLoading(false)
    })
  }, [category, search, filters])

  return { listings, loading }
}
