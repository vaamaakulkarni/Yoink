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
  userDorm,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  onClose: () => void
  userDorm: string
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-5 border-t-2 border-line"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-lg mb-4 text-ink">Filters</h3>

        <p className="text-sm text-muted font-medium mb-2">Dorm</p>
        <div className="flex gap-2 mb-4">
          {([
            { label: userDorm, value: null },
            { label: 'All dorms', value: '__all__' },
          ] as const).map((opt) => {
            const isActive =
              opt.value === null
                ? filters.dormOverride === null
                : filters.dormOverride === opt.value
            return (
              <button
                key={opt.label}
                onClick={() => onChange({ ...filters, dormOverride: opt.value })}
                className={`px-3 py-2 rounded-xl text-sm font-semibold font-display transition-colors ${
                  isActive ? 'bg-mint text-white' : 'bg-peach text-cocoa'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <label className="text-sm text-muted font-medium">
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
          className="w-full mb-4 accent-orange"
        />

        <p className="text-sm text-muted font-medium mb-2">Sort by</p>
        <div className="flex gap-2 mb-4">
          {(['newest', 'price_low', 'price_high'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...filters, sortBy: opt })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold font-display transition-colors ${
                filters.sortBy === opt
                  ? 'bg-orange text-white'
                  : 'bg-peach text-cocoa'
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

        <p className="text-sm text-muted font-medium mb-2">Yoink status</p>
        <div className="flex gap-2 mb-5">
          {(['all', 'first', 'reyoink'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange({ ...filters, yoinkStatus: opt })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold font-display transition-colors ${
                filters.yoinkStatus === opt
                  ? 'bg-orange text-white'
                  : 'bg-peach text-cocoa'
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
          className="w-full bg-orange yk-shadow-orange text-white rounded-2xl py-3 font-display font-bold transition-transform"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
