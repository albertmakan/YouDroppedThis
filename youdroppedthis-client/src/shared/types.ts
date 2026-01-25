import type { Effect, Particle } from '@/utils/physics'

export type PixelData = {
  palette: string[]
  mat: number[][]
  bg?: string
}

export type Profile = {
  id: string
  email: string
  username: string
  profile_picture?: PixelData
  bio?: string
  balance: number
  artworks_placed_count?: number
  artworks_collected_count?: number
  created_at: string
  updated_at?: string
}

export type Artwork = {
  id: number
  pixel_data: PixelData
  created_by: string
  canvas_id: number
  x: number
  y: number
  created_at: string
  collectable_after?: string
  collected_at?: string
  collected_by?: string
  expires_at: string
  is_expired?: boolean

  particles?: Particle[]
  collectionEffect?: Effect
  offscreenCanvas?: OffscreenCanvas
}

export type CanvasInfo = {
  id: number
  created_at: string
  name: string
  accepting_artworks: boolean
  placement_fee: number
  artwork_expiry_minutes: number
  min_visibility_minutes: number
  max_artworks_per_user_per_hour: number
  description: string
  min_x: number
  max_x: number
  min_y: number
  max_y: number
  background_color?: string
  palette?: string[]
  first_artwork_at?: string
  last_artwork_at?: string
  created_by?: string
  artwork_resolution: number
}

export type Transaction = {
  id: number
  user_id: string
  amount: number
  type:
    | 'drop_fee'
    | 'collection_reward'
    | 'daily_grant'
    | 'host_reward'
    | 'canvas_creation'
    | 'purchase'
  created_at: string
  artwork_id?: number
  canvas_id?: number
}
