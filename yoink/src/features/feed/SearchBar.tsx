'use client'

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="what are you after? 👀"
        className="w-full rounded-2xl border-2 border-[#EFE6D8] bg-white px-5 py-3.5 text-sm font-medium outline-none transition-colors focus:border-[#FF5A1F] placeholder:text-[#B5AD9C]"
      />
    </div>
  )
}
