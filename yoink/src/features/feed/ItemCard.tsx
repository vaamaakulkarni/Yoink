import Link from 'next/link'
import { Listing } from '@/lib/types'

export function ItemCard({ item }: { item: Listing }) {
  return (
    <Link
      href={`/item/${item.id}`}
      className="group relative block overflow-hidden rounded-3xl border-2 border-[#EFE6D8] bg-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100"
    >
      {item.is_free && (
        <div className="absolute top-3 -left-8 z-10 w-32 rotate-[-38deg] bg-[#00C2A8] py-1 text-center text-[10px] font-bold font-display uppercase tracking-wide text-white shadow-sm">
          Free Drop
        </div>
      )}

      {item.is_reyoink && (
        <div className="absolute top-2 right-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold font-display text-[#8A5A3A]">
          ♻️ Re-Yoinked
        </div>
      )}

      <div className="aspect-square bg-[#FFF8F0] overflow-hidden">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>

      <div className="p-3.5">
        <p className="font-semibold text-sm truncate text-[#1A1A1A]">{item.title}</p>
        <p
          className={`text-sm font-bold font-display mt-0.5 ${
            item.is_free ? 'text-[#00C2A8]' : 'text-[#FF5A1F]'
          }`}
        >
          {item.is_free ? 'FREE' : `$${item.price}`}
        </p>
      </div>
    </Link>
  )
}
