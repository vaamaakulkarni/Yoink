'use client'

export type Filters = {
  maxPrice: number
  sortBy: 'newest' | 'price_low' | 'price_high'
  yoinkStatus: 'all' | 'first' | 'reyoink'
  dormOverride: string | null
}

export function FilterSheet({
  filters,
  onChange,
  onClose,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-lg mb-4">Filters</h3>

        <label className="text-sm text-[#8A8578] font-medium">
          Max price: ${filters.maxPrice}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.maxPrice}
          onChange={(e) =>
            onChange({ ...filters, maxPrice: Number(e.target.value) })
          }
          className="w-full mb-4 accent-[#FF5A1F]"
        />

        <p className="text-sm text-[#8A8578] font-medium mb-2">Sort by</p>
        <div className="flex gap-2 mb-4">
          {(['newest', 'price_low', 'price_high'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...filters, sortBy: opt })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filters.sortBy === opt
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-[#FFE8D6] text-[#8A5A3A]'
              }`}
            >
              {opt === 'newest'
                ? 'Newest'
                : opt === 'price_low'
                ? 'Price: Low'
                : 'Price: High'}
            </button>
          ))}
        </div>

        <p className="text-sm text-[#8A8578] font-medium mb-2">Yoink status</p>
        <div className="flex gap-2 mb-5">
          {(['all', 'first', 'reyoink'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...filters, yoinkStatus: opt })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filters.yoinkStatus === opt
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-[#FFE8D6] text-[#8A5A3A]'
              }`}
            >
              {opt === 'all'
                ? 'All'
                : opt === 'first'
                ? 'First Yoink'
                : 'Re-Yoinked'}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#FF5A1F] text-white rounded-2xl py-3 font-display font-bold"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
