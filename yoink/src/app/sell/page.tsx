'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['Kitchenware', 'Winter Needs', 'Clothing', 'All']
const CONDITIONS = ['Like New', 'Good', 'Well Loved']
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://localhost:8000'

type AnalysisResult = {
  label: string
  confidence: number
  source: string
  condition: {
    label: string
    confidence: number
    new_score: number
  }
}

// Calls the real ML model running separately at localhost:8000.
// See yoink_backend/server.py for how to start that server.
async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${ML_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Analysis server not reachable — is it running?')
  }

  return response.json()
}

function suggestedCondition(label: string): string {
  if (label.includes('brand new')) return 'Like New'
  if (label.includes('gently used')) return 'Good'
  return 'Well Loved'
}

export default function SellUploadPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null)
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
      const result = await analyzeImage(file)
      setAiResult(result)
      setCondition(suggestedCondition(result.condition.label))
    } catch (err) {
      setAnalyzeError(
        'Could not reach the AI analysis server — you can still fill this in manually below.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-xs mb-4">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-line bg-white text-lg hover:border-orange transition-colors"
        >
          ←
        </Link>
      </div>

      <h1 className="font-display text-2xl font-bold text-ink mb-1">
        Got something to Yoink?
      </h1>
      <p className="text-sm text-muted mb-8 font-medium">
        Snap a photo to get started
      </p>

      <div className="w-full max-w-xs">
        {!preview ? (
          <label className="flex flex-col items-center justify-center aspect-square rounded-3xl border-2 border-dashed border-line bg-white cursor-pointer hover:border-orange transition-colors">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-sm font-semibold text-cocoa">
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
          <div className="rounded-3xl overflow-hidden border-2 border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your item" className="w-full aspect-square object-cover" />
          </div>
        )}

        {analyzing && (
          <p className="text-center text-sm text-faint font-medium mt-4">
            Working out what you&apos;re getting rid of... 🔍
          </p>
        )}

        {analyzeError && (
          <p className="text-center text-sm text-red-500 font-medium mt-4">{analyzeError}</p>
        )}

        {preview && !analyzing && (
          <div className="mt-5 bg-white rounded-2xl border-2 border-line p-4">
            {aiResult && (
              <div className="mb-3 space-y-1 text-xs font-semibold">
                <p className="text-mint">
                  AI thinks this is a: <span className="font-bold">{aiResult.label}</span>{' '}
                  ({Math.round(aiResult.confidence * 100)}% confident)
                </p>
                <p className="text-muted">
                  Condition suggestion: <span className="font-bold">{suggestedCondition(aiResult.condition.label)}</span>{' '}
                  ({Math.round(aiResult.condition.confidence * 100)}% confident). Please confirm it below.
                </p>
              </div>
            )}

            <label className="text-xs font-semibold text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm font-medium mb-3 mt-1 outline-none focus:border-orange"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="text-xs font-semibold text-muted">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm font-medium mb-4 mt-1 outline-none focus:border-orange"
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
                    condition_score: aiResult?.condition.new_score ?? null,
                    photoPreview: preview,
                  })
                )
                router.push('/sell/price')
              }}
              className="yk-shadow-orange w-full bg-orange text-white rounded-2xl py-3 font-display font-extrabold transition-transform"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
