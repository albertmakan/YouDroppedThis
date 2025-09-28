export interface User {
  id: number
  username: string
  email: string
  balance: number
  created_at: string
  artworks?: Artwork[]
}

export interface Artwork {
  id: number
  user_id: number
  username?: string
  x: number
  y: number
  resolution: 16 | 32 | 64
  pixel_data: string // JSON string of hex colors
  pixels?: string[][]
  created_at: string
  expires_at: string
  collected_by?: number
  collected_at?: string
  is_expired: boolean
}

export interface Transaction {
  id: number
  user_id: number
  type: 'placement' | 'collection' | 'bonus'
  amount: number
  artwork_id?: number
  description?: string
  created_at: string
}

export interface PlacementRequest {
  x: number
  y: number
  resolution: 16 | 32 | 64
  pixel_data: string
}

export interface CanvasState {
  artworks: Artwork[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export type WebSocketMessage = {
  userId?: number
} & (
  | { type: 'artwork_placed'; data: Artwork }
  | {
      type: 'artwork_collected'
      data: { collected: { id: number; x: number; y: number }; collectorId: number }
    }
  | {
      type: 'artwork_expired'
      data: { expired: { id: number; x: number; y: number }[] }
    }
  | { type: 'user_update' | 'auth' | 'ping' | 'pong'; data?: any }
)
export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  error: string
}

// Color palette for pixel art
export const DEFAULT_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#800080',
  '#008080',
  '#000080',
  '#FFA500',
  '#FFC0CB',
  '#A52A2A',
  '#FFFFE0',
  '#ADD8E6',
]
