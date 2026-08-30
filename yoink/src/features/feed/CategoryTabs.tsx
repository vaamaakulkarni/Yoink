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
            className={`whitespace-nowrap rounded-full px-[15px] py-2 text-[12.5px] font-bold font-display transition-colors ${
              isActive
                ? 'bg-orange text-white'
                : 'bg-peach text-cocoa hover:bg-[#FFDCC0]'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
