import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { User, AuthResponse } from '@/shared/types'
import { artworkApi, authApi } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(username: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.login(username, password)
      setAuth(response)
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
      return !error.value
    }
  }

  async function register(username: string, email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.register(username, email, password)
      setAuth(response)
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
      return !error.value
    }
  }

  function setAuth(authData: AuthResponse) {
    user.value = authData.user
    token.value = authData.token
    localStorage.setItem('auth_token', authData.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  async function loadUser(): Promise<void> {
    if (token.value && !user.value) {
      try {
        const userData = await authApi.getProfile()
        user.value = userData.user
      } catch (error) {
        logout() // Token is invalid
      }
    }
  }

  async function loadUserArtworks(): Promise<void> {
    if (user.value) {
      try {
        const { artworks } = await artworkApi.getUserArtworks()
        user.value.artworks = artworks
      } catch (error) {}
    }
  }

  function updateBalance(newBalance: number) {
    if (user.value) {
      user.value.balance = newBalance
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    updateBalance,
    clearError: () => {
      error.value = null
    },
    loadUserArtworks,
  }
})
