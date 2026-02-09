import axios from 'axios'
import type {
  Profile,
  Artwork,
  CanvasInfo,
  Transaction,
  PixelData,
  RecentActivity,
} from '@/shared/types'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  async signIn(email: string, password: string) {
    const response = await supabase.auth.signInWithPassword({ email, password })
    return response
  },

  async signOut() {
    const response = await supabase.auth.signOut({ scope: 'local' })
    return response
  },

  async signUp(username: string, email: string, password: string) {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return response
  },

  async updatePassword(password: string) {
    const response = await supabase.auth.updateUser({ password })
    return response
  },
}

export interface CanvasHostingRequest {
  name: string
  description: string
  canvasSize: 'sm' | 'md' | 'lg'
  artworkSize: number
  palette: string[]
  backgroundColor: string
  placementFee: number
}

export const canvasApi = {
  async getCanvases(userId: string, page: number = 1, limit: number = 16) {
    const response = await api.get(`/canvases/hosted-by/${userId}`, { params: { page, limit } })
    return response.data as { canvases: CanvasInfo[] }
  },

  async getNowActiveCanvases(userId?: string) {
    const response = await api.get(`/canvases/now`, { params: { userId } })
    return response.data as { canvases: CanvasInfo[] }
  },

  async createCanvas(hostingRequest: CanvasHostingRequest) {
    const response = await api.post(`/canvases`, hostingRequest)
    return response.data as { canvas: CanvasInfo; userProfile: Profile }
  },

  async getCanvasInfo(id: number) {
    const response = await api.get(`/canvases/${id}/info`)
    return response.data as { canvas: CanvasInfo; recentActivity: RecentActivity }
  },

  async getArtworksInArea(
    id: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const response = await api.get(`/canvases/${id}/area`, { params: bounds })
    return response.data as { artworks: Artwork[] }
  },

  async claimHostReward(canvasId: number) {
    const response = await api.post(`/canvases/${canvasId}/reward`)
    return response.data as { canvas: CanvasInfo; userProfile: Profile; reward: number }
  },
}

export interface PlacementRequest {
  x: number
  y: number
  pixelData: PixelData
}

export const artworkApi = {
  async placeArtwork(canvasId: number, placement: PlacementRequest) {
    const response = await api.post('/artworks/place', placement, {
      params: { canvas_id: canvasId },
    })
    return response.data as { artwork: Artwork; userProfile: Profile }
  },

  async collectArtwork(canvasId: number, artworkId: number) {
    const response = await api.post(
      `/artworks/collect/${artworkId}`,
      {},
      { params: { canvas_id: canvasId } },
    )
    return response.data as { artwork: Artwork; userProfile: Profile }
  },

  async getUserArtworks(
    userId: string,
    type: 'placed' | 'collected' = 'placed',
    page: number = 1,
    limit: number = 16,
  ) {
    const response = await api.get(`/artworks/${type}/${userId}`, { params: { page, limit } })
    return response.data as { artworks: Artwork[] }
  },
}

export const userApi = {
  async getProfile(id: string) {
    const response = await api.get(`/users/${id}/profile`)
    return response.data as { profile: Profile }
  },

  async updateProfile(profileUpdate: { bio?: string; profilePicture?: PixelData }) {
    const response = await api.patch(`/users`, profileUpdate)
    return response.data as { profile: Profile }
  },
}

export interface TransactionResult {
  success: boolean
  message: string
  newBalance?: number
  claimedAt: string
  userId: string
}

export const transactionApi = {
  async getTransactions(page: number = 20, limit: number = 0) {
    const response = await api.get('/transactions', { params: { page, limit } })
    return response.data as { transactions: Transaction[] }
  },

  async claimDailyBonus() {
    const response = await api.post('/transactions/daily-bonus')
    return response.data as TransactionResult
  },
}
