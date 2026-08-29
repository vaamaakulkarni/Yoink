import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton — one client for the whole app.
export const supabase = createBrowserClient(url, anonKey)

// Factory form, for code that calls createClient().
export function createClient() {
  return supabase
}