'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// TODO: swap this out for your friend's real AI classification function
// once you have the actual code. This should take the uploaded photo
// and return { category, condition, tag }.
async function classifyImage(file: File): Promise<{
  category: string
  condition: string
  tag: string
}> {
  // Fake delay to simulate a real API call, remove once wired up for real
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return {
    category: 'Kitchenware',
    condition: 'Good',
    tag: 'Dorm essential',
  }
}

export default function SellUploadPage() {
  const router = useRouter()
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    category: string
    condition: string
    tag: string
  } | null>(null)

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setAnalyzing(true)
    setResult(null)

    const classification = await classifyImage(file)

    setResult(classification)
    setAnalyzing(false)
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-[#1A1A1A] mb-1">
        Got something to Yoink?
      </h1>
      <p className="text-sm text-[#8A8578] mb-8 font-medium">
        Snap a photo to get started
      </p>

      <div className="w-full max-w-xs">
        {!preview ? (
          <label className="flex flex-col items-center justify-center aspect-square rounded-3xl border-2 border-dashed border-[#EFE6D8] bg-white cursor-pointer hover:border-[#FF5A1F] transition-colors">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-sm font-semibold text-[#8A5A3A]">
              Tap to take or choose a photo
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="rounded-3xl overflow-hidden border-2 border-[#EFE6D8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your item" className="w-full aspect-square object-cover" />
          </div>
        )}

        {analyzing && (
          <p className="text-center text-sm text-[#B5AD9C] font-medium mt-4">
            Working out what you&apos;re getting rid of... 🔍
          </p>
        )}

        {result && (
          <div className="mt-5 bg-white rounded-2xl border-2 border-[#EFE6D8] p-4">
            <p className="text-xs font-semibold text-[#8A8578] mb-3">
              AI guessed this — edit anything that&apos;s wrong 👇
            </p>

            <label className="text-xs font-semibold text-[#8A8578]">Category</label>
            <input
              type="text"
              value={result.category}
              onChange={(e) => setResult({ ...result, category: e.target.value })}
              className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2 text-sm font-medium mb-3 mt-1 outline-none focus:border-[#FF5A1F]"
            />

            <label className="text-xs font-semibold text-[#8A8578]">Condition</label>
            <input
              type="text"
              value={result.condition}
              onChange={(e) => setResult({ ...result, condition: e.target.value })}
              className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2 text-sm font-medium mb-4 mt-1 outline-none focus:border-[#FF5A1F]"
            />

            <button
              onClick={() => {
                // Pass the classification forward to the next step (price/yoink toggle)
                sessionStorage.setItem(
                  'yoink_draft',
                  JSON.stringify({ ...result, photoPreview: preview })
                )
                router.push('/sell/price')
              }}
              className="w-full bg-[#FF5A1F] text-white rounded-2xl py-3 font-display font-bold hover:bg-[#E64A0F] transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
