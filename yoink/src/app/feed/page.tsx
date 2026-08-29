'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CategoryTabs } from '@/features/feed/CategoryTabs'
import { SearchBar } from '@/features/feed/SearchBar'
import { ItemCard } from '@/features/feed/ItemCard'
import { FilterSheet, Filters } from '@/features/feed/FilterSheet'
import { useListings } from '@/features/feed/useListings'

const CURRENT_USER_DORM = 'Queen Mary Building'
const SUGGESTIONS = ['Kitchenware', 'Winter Needs', 'Free']

export default function FeedPage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    maxPrice: 100,
    sortBy: 'newest',
    yoinkStatus: 'all',
    dormOverride: null,
  })

  const activeDorm =
    filters.dormOverride === '__all__'
      ? null
      : filters.dormOverride ?? CURRENT_USER_DORM

  const { listings, loading } = useListings(category, search, filters, activeDorm)
  const isSearching = search.trim() !== ''

  return (
    <main className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-3 items-start pt-8 pb-2">
          <div className="flex items-center gap-2">
            <Link
              href="/basket"
              className="flex items-center gap-1.5 rounded-full bg-white border-2 border-[#EFE6D8] text-[#1A1A1A] px-4 py-2 text-sm font-display font-bold hover:border-[#FF5A1F] transition-colors"
            >
              🧺 Basket
            </Link>
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#1A1A1A]">
              Yoink<span className="text-[#FF5A1F]">.</span>
            </h1>
          </div>
          <div className="flex justify-end items-center gap-2">
            <Link
              href="/chat"
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
              aria-label="Chats"
            >
              💬
            </Link>
            <Link
              href="/sell"
              className="flex items-center gap-1.5 rounded-full bg-[#FF5A1F] text-white px-4 py-2 text-sm font-display font-bold hover:bg-[#E64A0F] transition-colors"
            >
              <span className="text-base leading-none">+</span> Sell
            </Link>
          </div>
        </div>
        <p className="text-sm text-[#8A8578] text-center font-medium mb-1">
          University of Sydney · Dorm Marketplace
        </p>

        <p className="text-center text-xs text-[#B5AD9C] font-medium mb-3">
          {activeDorm ? `Showing items from ${activeDorm}` : 'Showing items from all dorms'}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-3.5 rounded-2xl border-2 border-[#EFE6D8] bg-white text-sm font-semibold font-display hover:border-[#FF5A1F] transition-colors"
          >
            Filters
          </button>
        </div>

        <div className="mb-5">
          <CategoryTabs active={category} onChange={setCategory} />
        </div>

        {loading ? (
          <p className="text-center text-[#B5AD9C] py-10 font-medium">Loading the good stuff...</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🕵️</p>
            <p className="font-display font-bold text-[#1A1A1A] mb-1">
              {isSearching ? `Nothing matches "${search}"` : 'Nothing here yet'}
            </p>
            <p className="text-sm text-[#B5AD9C] mb-5">
              {isSearching
                ? 'Try a different word, or browse a category instead'
                : 'Be the first to drop something 👀'}
            </p>
            {isSearching && (
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSearch('')
                      setCategory(s)
                    }}
                    className="rounded-full bg-[#FFE8D6] px-4 py-2 text-sm font-semibold font-display text-[#8A5A3A] hover:bg-[#FFDCC0] transition-colors"
                  >
                    Try {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {listings.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {showFilters && (
          <FilterSheet
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
            userDorm={CURRENT_USER_DORM}
          />
        )}
      </div>
    </main>
  )
}