import type { Effect, Particle } from '@/utils/physics'

export type PixelData = {
  palette: string[]
  mat: number[][]
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
  user_id: string
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
  name: string
  description?: string
  max_artworks_per_user_per_hour: number
  artwork_expiry_minutes: number
  min_visibility_minutes?: number
  placement_fee: number
  created_at: string
  updated_at?: string
  grid_size: number
  is_active?: boolean
  max_x?: number
  max_y?: number
  min_x?: number
  min_y?: number
  premium_zone_enabled?: boolean
  background_color?: string
  theme?: string
  palette?: string[]
  total_artworks_placed: number
  total_artworks_collected: number
  active_artworks_count: number
}

export type Transaction = {
  id: number
  user_id: string
  amount: number
  type: string
  created_at: string
  description?: string
  artwork_id?: number
}

export interface PlacementRequest {
  x: number
  y: number
  pixelData: PixelData
}
