import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Profile } from '@/shared/types'
import { authApi, userApi } from '@/services/api'
import type { AuthResponse } from '@supabase/auth-js'
import { supabase } from '@/services/supabase'

type UserInfo = Profile & { confirmed_at?: string }

export type GuestIdentity = { guestName: string; guestSessionId: string }

const GUEST_STORAGE_PREFIX = 'ydt_guest_identity:'

function randomSuffix() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function generateGuestName(canvasId: number) {
  return `Guest-${canvasId}-${randomSuffix()}`
}

function generateGuestSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  const guestIdentities = ref<Record<number, GuestIdentity>>({})

  function getGuestStorageKey(canvasId: number) {
    return `${GUEST_STORAGE_PREFIX}${canvasId}`
  }

  function isGuestIdentity(value: unknown): value is GuestIdentity {
    return (
      !!value &&
      typeof value === 'object' &&
      'guestName' in value &&
      'guestSessionId' in value &&
      typeof (value as any).guestName === 'string' &&
      typeof (value as any).guestSessionId === 'string'
    )
  }

  function loadGuestIdentityFromStorage(canvasId: number): GuestIdentity | null {
    if (typeof window === 'undefined') return null
    const existing = window.localStorage.getItem(getGuestStorageKey(canvasId))
    if (!existing) return null
    try {
      const parsed = JSON.parse(existing)
      if (isGuestIdentity(parsed) && parsed.guestName && parsed.guestSessionId) return parsed
    } catch {
      // ignore
    }
    return null
  }

  function persistGuestIdentity(canvasId: number, identity: GuestIdentity) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getGuestStorageKey(canvasId), JSON.stringify(identity))
  }

  function ensureGuestIdentity(canvasId: number): GuestIdentity {
    const existing = guestIdentities.value[canvasId]
    if (existing) return existing

    const fromStorage = loadGuestIdentityFromStorage(canvasId)
    const identity =
      fromStorage ?? { guestName: generateGuestName(canvasId), guestSessionId: generateGuestSessionId() }
    guestIdentities.value[canvasId] = identity
    if (!fromStorage) persistGuestIdentity(canvasId, identity)
    return identity
  }

  function getGuestIdentity(canvasId: number) {
    return ensureGuestIdentity(canvasId)
  }

  function setGuestName(canvasId: number, guestName: string) {
    const current = ensureGuestIdentity(canvasId)
    const nextName = guestName.trim()
    const next: GuestIdentity = { ...current, guestName: nextName || current.guestName }
    guestIdentities.value[canvasId] = next
    persistGuestIdentity(canvasId, next)
  }

  function regenerateGuestIdentity(canvasId: number) {
    const next: GuestIdentity = {
      guestName: generateGuestName(canvasId),
      guestSessionId: generateGuestSessionId(),
    }
    guestIdentities.value[canvasId] = next
    persistGuestIdentity(canvasId, next)
  }

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
        if (authError.message === 'Database error saving new user') {
          error.value = 'This username already exists'
        } else {
          error.value = authError.message
        }
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
      confirmed_at: authUserData.confirmed_at,
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
  })

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading,
    error,
    getGuestIdentity,
    setGuestName,
    regenerateGuestIdentity,
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
