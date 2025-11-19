import axios from 'axios'
import type {
  Profile,
  Artwork,
  CanvasInfo,
  Transaction,
  PlacementRequest,
  PixelData,
} from '@/shared/types'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: '/api',
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

export const canvasApi = {
  async getCanvasInfo(id: number) {
    const response = await api.get(`/canvases/${id}/info`)
    return response.data as CanvasInfo
  },

  async getArtworksInArea(
    id: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const response = await api.get(`/canvases/${id}/area`, { params: bounds })
    return response.data as { artworks: Artwork[] }
  },
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
    type: 'placed' | 'collected' = 'placed',
    page: number = 1,
    limit: number = 16,
  ) {
    const response = await api.get(`/artworks/${type}`, { params: { page, limit } })
    return response.data as { artworks: Artwork[]; total: number }
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

export const transactionApi = {
  async getTransactions(page: number = 20, limit: number = 0) {
    const response = await api.get('/transactions', { params: { page, limit } })
    return response.data as { transactions: Transaction[] }
  },

  async claimDailyBonus() {
    const response = await api.post('/transactions/daily-bonus')
    return response.data as { success: boolean; message: string; newBalance?: number }
  },

  // temporary
  async purchaseCoins(amount: number) {
    const response = await api.post('/transactions/purchase', { amount })
    return response.data as { success: boolean; message: string; newBalance?: number }
  },
}
