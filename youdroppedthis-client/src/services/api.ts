import axios from 'axios'
import type {
  User,
  Artwork,
  CanvasState,
  Transaction,
  PlacementRequest,
  AuthResponse,
} from '@/shared/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password })
    return response.data as AuthResponse
  },

  async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', { username, email, password })
    return response.data as AuthResponse
  },

  async getProfile() {
    const response = await api.get('/user/profile')
    return response.data as { user: User }
  },
}

export const canvasApi = {
  async getCanvasState() {
    const response = await api.get('/canvas/state')
    return response.data as CanvasState
  },

  async getArtworksInArea(minX: number, maxX: number, minY: number, maxY: number) {
    const response = await api.get('/canvas/area', {
      params: { minX, maxX, minY, maxY },
    })
    return response.data as { artworks: Artwork[] }
  },
}

export const artworkApi = {
  async placeArtwork(placement: PlacementRequest) {
    const response = await api.post('/artwork/place', placement)
    return response.data as { artwork: Artwork }
  },

  async collectArtwork(artworkId: number) {
    const response = await api.post(`/artwork/${artworkId}/collect`)
    return response.data as { artwork: Artwork; user: User }
  },

  async getUserArtworks(type: 'placed' | 'collected' | 'all' = 'all') {
    const response = await api.get('/artwork/mine', { params: { type } })
    return response.data as { artworks: Artwork[] }
  },
}

export const userApi = {
  async getTransactions(limit: number = 50, offset: number = 0) {
    const response = await api.get('/user/transactions', { params: { limit, offset } })
    return response.data as { transactions: Transaction[] }
  },

  async claimDailyBonus() {
    const response = await api.post('/user/daily-bonus')
    return response.data as { success: boolean; message: string; newBalance?: number }
  },
}
