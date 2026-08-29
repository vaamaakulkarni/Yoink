import Link from 'next/link'
import { Listing } from '@/lib/types'

export function ItemCard({ item }: { item: Listing }) {
  return (
    <Link
      href={`/item/${item.id}`}
      className={`yk-card group relative block overflow-hidden rounded-3xl border-2 ${
        item.is_free ? 'bg-mint border-mint' : 'bg-white border-line'
      }`}
    >
      {item.is_free && (
        <div className="absolute top-2 left-2 z-10 rounded-full bg-mint px-2.5 py-1 text-[10px] font-display font-extrabold uppercase tracking-[.06em] text-white">
          Free Drop
        </div>
      )}

      {item.is_reyoink && !item.is_free && (
        <div className="absolute top-2 left-2 z-10 rounded-full bg-[rgba(255,248,240,.94)] px-2.5 py-1 text-[9.5px] font-display font-bold text-cocoa">
          ♻️ Re-Yoinked
        </div>
      )}

      <div className="aspect-square bg-cream overflow-hidden">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-3">
        <p className={`font-sans font-semibold text-[13.5px] truncate ${item.is_free ? 'text-white' : 'text-ink'}`}>
          {item.title}
        </p>
        <p
          className={`text-xl font-display font-extrabold tracking-[-.025em] mt-0.5 ${
            item.is_free ? 'text-white' : 'text-orange'
          }`}
        >
          {item.is_free ? 'FREE' : `$${item.price}`}
        </p>
      </div>
    </Link>
  )
}
