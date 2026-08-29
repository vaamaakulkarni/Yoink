export type Listing = {
  id: string
  title: string
  description: string | null
  price: number | null
  is_free: boolean
  category: string
  condition: string | null
  is_reyoink: boolean
  image_url: string | null
  seller_name: string | null
  dorm: string | null
  created_at: string
}
