'use client'

const CATEGORIES = ['All', 'Kitchenware', 'Winter Needs', 'Clothing', 'Free']

export function CategoryTabs({
  active,
  onChange,
}: {
  active: string
  onChange: (category: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold font-display transition-all ${
              isActive
                ? 'bg-[#FF5A1F] text-white shadow-sm shadow-orange-200'
                : 'bg-[#FFE8D6] text-[#8A5A3A] hover:bg-[#FFDCC0]'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
