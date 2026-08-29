'use client'

import { useState } from 'react'
import { Header } from '@/features/feed/Header'
import { CategoryTabs } from '@/features/feed/CategoryTabs'
import { SearchBar } from '@/features/feed/SearchBar'
import { ItemCard } from '@/features/feed/ItemCard'
import { FilterSheet, Filters } from '@/features/feed/FilterSheet'
import { useListings } from '@/features/feed/useListings'

export default function HomePage() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    maxPrice: 100,
    sortBy: 'newest',
    yoinkStatus: 'all',
  })

  const { listings, loading } = useListings(category, search, filters)

  return (
    <main className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Header />

        <div className="flex items-center gap-2 mb-4 mt-2">
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
          <p className="text-center text-[#B5AD9C] py-10 font-medium">
            Nothing here yet — be the first to drop something 👀
          </p>
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
          />
        )}
      </div>
    </main>
  )
}
