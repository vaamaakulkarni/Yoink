'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CategoryTabs } from '@/features/feed/CategoryTabs'
import { SearchBar } from '@/features/feed/SearchBar'
import { ItemCard } from '@/features/feed/ItemCard'
import { FilterSheet, Filters } from '@/features/feed/FilterSheet'
import { useListings } from '@/features/feed/useListings'

const FALLBACK_DORM = 'Queen Mary Building'
const SUGGESTIONS = ['Kitchenware', 'Winter Needs', 'Free']
const CATEGORIES = ['All', 'Kitchenware', 'Winter Needs', 'Clothing', 'Free']

export default function FeedPage() {
  const [userDorm, setUserDorm] = useState(FALLBACK_DORM)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    maxPrice: 100,
    sortBy: 'newest',
    yoinkStatus: 'all',
    dormOverride: null,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.dorm) {
        setUserDorm(user.user_metadata.dorm as string)
      }
    })
  }, [])

  const activeDorm =
    filters.dormOverride === '__all__'
      ? null
      : filters.dormOverride ?? userDorm

  const { listings, loading } = useListings(category, search, filters, activeDorm)
  const isSearching = search.trim() !== ''

  const searchAndFilterRow = (
    <div className="flex items-center gap-2 mb-4 lg:mb-[18px]">
      <div className="flex-1">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <button
        onClick={() => setShowFilters(true)}
        className="px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-sm font-bold font-display hover:border-orange transition-colors"
      >
        Filters
      </button>
    </div>
  )

  const grid =
    loading ? (
      <p className="text-center text-faint py-10 font-medium">Loading the good stuff...</p>
    ) : listings.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-3xl mb-2">🕵️</p>
        <p className="font-display font-bold text-ink mb-1">
          {isSearching ? `Nothing matches "${search}"` : 'Nothing here yet'}
        </p>
        <p className="text-sm text-faint mb-5">
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
                className="rounded-full bg-peach px-4 py-2 text-sm font-semibold font-display text-cocoa hover:bg-[#FFDCC0] transition-colors"
              >
                Try {s}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-[15px]">
        {listings.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    )

  return (
    <main className="min-h-screen">
      <div className="lg:flex">
        {/* Desktop rail */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[232px] lg:shrink-0 lg:h-screen lg:sticky lg:top-0 lg:border-r-2 lg:border-line lg:bg-[rgba(255,248,240,.7)] lg:px-[18px] lg:py-[22px] lg:gap-5">
          <div>
            <h1 className="font-display text-[30px] font-extrabold tracking-[-.04em] leading-none text-ink">
              Yoink<span className="text-orange">.</span>
            </h1>
            <p className="text-[10.5px] leading-tight font-medium text-muted mt-1.5">
              University of Sydney · Dorm Marketplace
            </p>
          </div>

          <Link
            href="/sell"
            className="yk-shadow-orange bg-orange text-white rounded-2xl py-3 text-center text-sm font-display font-extrabold transition-transform"
          >
            + Sell
          </Link>

          <div className="flex flex-col gap-0.5">
            <Link
              href="/basket"
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[13.5px] font-bold font-display text-muted hover:bg-white/60 transition-colors"
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
              href="/chat"
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[13.5px] font-bold font-display text-muted hover:bg-white/60 transition-colors"
            >
              💬 Chats
            </Link>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-[.08em] text-faint mb-2">CATEGORY</p>
            <div className="flex flex-col gap-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left px-2.5 py-2 rounded-[10px] text-[13px] font-display transition-colors ${
                    category === cat
                      ? 'bg-orange text-white font-bold'
                      : cat === 'Free'
                      ? 'text-mint-dark font-semibold hover:bg-white/60'
                      : 'text-muted font-semibold hover:bg-white/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilters(true)}
            className="mt-auto text-left bg-[rgba(0,194,168,.11)] rounded-2xl p-3 hover:bg-[rgba(0,194,168,.18)] transition-colors"
          >
            <p className="font-mono text-[9.5px] tracking-[.06em] text-mint-dark">SHOWING</p>
            <p className="font-display font-bold text-[12.5px] text-mint-dark mt-0.5">
              {activeDorm ?? 'All dorms'}
            </p>
            <p className="text-[10.5px] font-semibold text-[#00A28C] mt-1">Change</p>
          </button>
        </aside>

        <div className="flex-1 max-w-2xl mx-auto lg:max-w-none w-full px-4 pb-8 lg:px-6 lg:py-[22px]">
          {/* Mobile header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 pt-8 pb-2">
              <Link
                href="/basket"
                className="flex items-center gap-1.5 rounded-full bg-white border-2 border-line text-ink px-4 py-2 text-sm font-display font-bold hover:border-orange transition-colors"
              >
                🧺 Basket
              </Link>
              <div className="flex-1 flex justify-end items-center gap-2">
                <Link
                  href="/chat"
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors"
                  aria-label="Chats"
                >
                  💬
                </Link>
                <Link
                  href="/sell"
                  className="yk-shadow-orange flex items-center gap-1.5 rounded-full bg-orange text-white px-4 py-2 text-sm font-display font-extrabold transition-transform"
                >
                  <span className="text-base leading-none">+</span> Sell
                </Link>
              </div>
            </div>

            <div className="text-center mb-3">
              <h1 className="font-display text-4xl font-extrabold tracking-[-.04em] text-ink">
                Yoink<span className="text-orange">.</span>
              </h1>
              <p className="text-xs text-muted font-medium mt-1.5">
                University of Sydney · Dorm Marketplace
              </p>
              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center gap-1.5 mt-2.5 bg-[rgba(0,194,168,.13)] rounded-full px-3 py-1.5 hover:bg-[rgba(0,194,168,.2)] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                <span className="text-[11.5px] font-semibold text-mint-dark">
                  {activeDorm ? `Showing items from ${activeDorm}` : 'Showing items from all dorms'}
                </span>
              </button>
            </div>
          </div>

          {searchAndFilterRow}

          <div className="mb-5 lg:hidden">
            <CategoryTabs active={category} onChange={setCategory} />
          </div>

          {grid}
        </div>
      </div>

      {showFilters && (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          userDorm={userDorm}
        />
      )}
    </main>
  )
}
