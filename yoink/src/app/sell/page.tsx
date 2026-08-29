'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['Kitchenware', 'Winter Needs', 'Clothing', 'All']
const CONDITIONS = ['Like New', 'Good', 'Well Loved']

// Calls the real ML model running separately at localhost:8000.
// See yoink_backend/server.py for how to start that server.
async function classifyImage(file: File): Promise<{
  label: string
  confidence: number
  source: string
}> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('http://localhost:8000/classify', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Classification server not reachable — is it running?')
  }

  return response.json()
}

export default function SellUploadPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ label: string; confidence: number } | null>(null)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(CONDITIONS[0])

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setAnalyzing(true)
    setAnalyzeError(null)
    setAiResult(null)

    try {
      const result = await classifyImage(file)
      setAiResult({ label: result.label, confidence: result.confidence })
    } catch (err) {
      setAnalyzeError(
        'Could not reach the AI classifier — you can still fill this in manually below.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-xs mb-4">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#EFE6D8] bg-white text-lg hover:border-[#FF5A1F] transition-colors"
        >
          ←
        </Link>
      </div>

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

        {analyzeError && (
          <p className="text-center text-sm text-red-500 font-medium mt-4">{analyzeError}</p>
        )}

        {preview && !analyzing && (
          <div className="mt-5 bg-white rounded-2xl border-2 border-[#EFE6D8] p-4">
            {aiResult && (
              <p className="text-xs font-semibold text-[#00C2A8] mb-3">
                AI thinks this is a: <span className="font-bold">{aiResult.label}</span>{' '}
                ({Math.round(aiResult.confidence * 100)}% confident)
              </p>
            )}

            <label className="text-xs font-semibold text-[#8A8578]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2 text-sm font-medium mb-3 mt-1 outline-none focus:border-[#FF5A1F]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="text-xs font-semibold text-[#8A8578]">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border-2 border-[#EFE6D8] px-3 py-2 text-sm font-medium mb-4 mt-1 outline-none focus:border-[#FF5A1F]"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                sessionStorage.setItem(
                  'yoink_draft',
                  JSON.stringify({
                    category,
                    condition,
                    ai_tag: aiResult?.label ?? null,
                    photoPreview: preview,
                  })
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
