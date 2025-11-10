import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Profile } from '@/shared/types'
import { authApi, userApi } from '@/services/api'
import type { AuthResponse } from '@supabase/auth-js'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Profile | null>(null)

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: authError } = await authApi.signIn(email, password)
      if (authError) {
        error.value = authError.message
      } else {
        setAuth(data.user)
      }
    } catch (err: any) {
      error.value = 'Server error'
    } finally {
      isLoading.value = false
      return !error.value
    }
  }

  async function register(username: string, email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: authError } = await authApi.signUp(username, email, password)
      if (authError) {
        error.value = authError.message
      } else {
        setAuth(data.user)
      }
    } catch (err: any) {
      error.value = 'Server error'
    } finally {
      isLoading.value = false
      return !error.value
    }
  }

  function setAuth(authUserData: AuthResponse['data']['user']) {
    user.value = authUserData && {
      id: authUserData.id,
      email: authUserData.email || '',
      username: authUserData.user_metadata.username ?? '',
      created_at: authUserData.created_at,
      balance: 0,
    }
    loadProfile()
  }

  async function logout() {
    const { error: authError } = await authApi.signOut()
    if (authError) {
      error.value = authError.message
    } else {
      user.value = null
    }
  }

  async function loadProfile() {
    if (user.value) {
      try {
        const userData = await userApi.getProfile(user.value.id)
        user.value = { ...user.value, ...userData.profile }
      } catch (error) {
        logout() // Token is invalid
      }
    }
  }

  function setProfileInfo(profileInfo: Partial<Profile>) {
    if (user.value) {
      user.value = { ...user.value, ...profileInfo }
    }
  }

  supabase.auth.getSession().then(({ data: { session }, error }) => {
    setAuth(session?.user ?? null)
    loadProfile()
  })

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadProfile,
    setProfileInfo,
    clearError: () => {
      error.value = null
    },
  }
})
