export const PARTNER_COLUMNS =
  "id,name,slug,category,description,logo_url,cover_url,gallery_urls,benefit_title,benefit_description,coupon_code,whatsapp_url,instagram_url,website_url,address,is_featured,is_active,display_order,valid_until,created_by,created_at,updated_at"

export interface Partner {
  id: string
  name: string
  slug: string
  category: string
  description: string
  logo_url: string | null
  cover_url: string | null
  gallery_urls: string[]
  benefit_title: string
  benefit_description: string
  coupon_code: string | null
  whatsapp_url: string | null
  instagram_url: string | null
  website_url: string | null
  address: string | null
  is_featured: boolean
  is_active: boolean
  display_order: number
  valid_until: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
