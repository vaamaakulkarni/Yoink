'use client'

import { useState } from 'react'
import { Header } from '@/features/feed/Header'
import { CategoryTabs } from '@/features/feed/CategoryTabs'
import { SearchBar } from '@/features/feed/SearchBar'
import { ItemCard } from '@/features/feed/ItemCard'
import { FilterSheet, Filters } from '@/features/feed/FilterSheet'
import { useListings } from '@/features/feed/useListings'

// TEMP: until Frontend 3's auth/signup is wired in, hardcode the
// logged-in user's dorm here. Once real auth exists, replace this
// with the dorm pulled from the signed-in user's profile — e.g.
// const { user } = useUser(); const userDorm = user.dorm
const CURRENT_USER_DORM = 'Queen Mary Building'

const SUGGESTIONS = ['Kitchenware', 'Winter Needs', 'Free']

export default function HomePage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    maxPrice: 100,
    sortBy: 'newest',
    yoinkStatus: 'all',
    dormOverride: null,
  })

  // null override = scope to the user's own dorm.
  // '__all__' = no dorm filter at all.
  // any other string = browsing a specific different dorm.
  const activeDorm =
    filters.dormOverride === '__all__'
      ? null
      : filters.dormOverride ?? CURRENT_USER_DORM

  const { listings, loading } = useListings(category, search, filters, activeDorm)

  const isSearching = search.trim() !== ''

  return (
    <main className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Header />

        <p className="text-center text-xs text-[#B5AD9C] font-medium -mt-1 mb-3">
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
