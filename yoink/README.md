# Yoink 🎃

Swipe-based give-away app for dorm residents — snap a photo of stuff you don't need, AI tags it instantly, someone claims it before it hits the bin.

## Stack
- Next.js + TypeScript + Tailwind
- Supabase (auth, Postgres, realtime chat, storage)
- Claude API (vision — photo to listing)
- Framer Motion (swipe feed)
- shadcn/ui (components)

## Team split
- **AI listing pipeline**: `src/features/ai-listing/`
- **Chat**: `src/features/chat/`
- **Swipe feed / frontend**: `src/features/feed/`, `src/app/`

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in real keys (get these from the team lead — never commit `.env.local`)
3. `npx shadcn@latest init` (if not already run) then `npx shadcn@latest add card button input`
4. `npm run dev`

## Branching
- Branch off `main`: `feature/ai-vision`, `feature/chat`, `feature/swipe-feed`, etc.
- PR into `main`, even a quick self-merge — keeps 5 people from overwriting each other.
