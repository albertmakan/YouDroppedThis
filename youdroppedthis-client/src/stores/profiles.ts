import { userApi } from '@/services/api'
import type { Profile } from '@/shared/types'
import { defineStore } from 'pinia'
import { computed, onMounted, ref, watch, type Ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  const profiles = ref<Map<string, Profile>>(new Map())
  const loading = ref<Set<string>>(new Set())
  const errors = ref<Map<string, string>>(new Map())

  async function loadProfile(id: string): Promise<Profile | null> {
    if (profiles.value.has(id)) {
      return profiles.value.get(id)!
    }
    if (loading.value.has(id)) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!loading.value.has(id)) {
            clearInterval(check)
            resolve(profiles.value.get(id) || null)
          }
        }, 100)
      })
    }
    loading.value.add(id)
    errors.value.delete(id)

    try {
      const { profile } = await userApi.getProfile(id)
      profiles.value.set(id, profile)
      return profile
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.value.set(id, message)
      return null
    } finally {
      loading.value.delete(id)
    }
  }

  function getProfile(id: string): Profile | undefined {
    return profiles.value.get(id)
  }

  function clearProfile(id: string) {
    profiles.value.delete(id)
    errors.value.delete(id)
  }

  return {
    profiles,
    loading,
    errors,
    loadProfile,
    getProfile,
    clearProfile,
  }
})

export function useProfile(userId: string | Ref<string>) {
  const profileStore = useProfileStore()
  const id = ref(userId)

  const profile = computed(() => profileStore.getProfile(id.value))
  const isLoading = computed(() => profileStore.loading.has(id.value))
  const error = computed(() => profileStore.errors.get(id.value))

  onMounted(() => {
    if (id.value) {
      profileStore.loadProfile(id.value)
    }
  })

  watch(
    () => id.value,
    (newId) => {
      if (newId) {
        profileStore.loadProfile(newId)
      }
    },
  )

  async function refresh() {
    profileStore.clearProfile(id.value)
    await profileStore.loadProfile(id.value)
  }

  return {
    profile,
    isLoading,
    error,
    refresh,
  }
}
