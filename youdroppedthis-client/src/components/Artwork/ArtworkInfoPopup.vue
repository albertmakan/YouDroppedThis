<template>
  <div
    class="fixed pointer-events-none border-2 border-neutral-600 border-dashed text-neutral-200"
    :style="{
      left: `${left}px`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${size}px`,
    }"
  >
    <div class="relative h-full">
      <div
        class="absolute bottom-full left-1/2 -translate-x-1/2 min-w-full box-content flex gap-4 justify-between pointer-events-auto bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-neutral-600"
        @touchmove.prevent.passive
      >
        <div class="flex gap-2 items-center">
          <div v-if="profileLoading" class="bg-neutral-700 animate-pulse rounded-full size-6" />
          <div v-else class="rounded-full bg-teal-800 size-6 text-white text-center">
            {{ profile?.username.charAt(0) }}
          </div>
          <span v-if="profileLoading" class="bg-neutral-700 animate-pulse rounded-md w-32 h-4" />
          <span v-else class="">{{ profile?.username }}</span>
        </div>
        <div class="relative h-6">
          <button class="size-6 text-neutral-700 cursor-pointer peer">
            <TimeRemainingIcon :remaining="timeRemaining.p" />
          </button>
          <div
            class="peer-focus:block hidden active:block absolute top-full left-1/2 -translate-x-1/2 p-1 mt-0.5 bg-black rounded-md text-neutral-200 text-sm shadow-md border border-neutral-600 pointer-events-none"
          >
            {{ timeRemaining.s }}
          </div>
        </div>
      </div>

      <div
        class="absolute top-full left-1/2 -translate-x-1/2 min-w-full box-content bg-black/90 backdrop-blur-sm rounded-lg flex justify-center p-1 border border-neutral-600"
      >
        <button
          @click="collectArtwork"
          @touchmove.prevent.passive
          class="cursor-pointer pointer-events-auto size-8"
          title="Collect"
        >
          <CollectIcon />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '@/shared/types'
import CollectIcon from '../Icons/CollectIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { artworkApi } from '@/services/api'
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import TimeRemainingIcon from '../Icons/TimeRemainingIcon.vue'
import { getH_M_S } from '@/utils/date'
import { useProfile } from '@/stores/profiles'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const authStore = useAuthStore()

const { top, left, size, artwork } = defineProps<{
  top: number
  left: number
  size: number
  artwork: Artwork
}>()

const { profile, isLoading: profileLoading } = useProfile(artwork.user_id)

const timeInfo = computed(() => {
  const expirationTime = new Date(artwork.expires_at).getTime()
  const totalTime = expirationTime - new Date(artwork.created_at).getTime()
  return { expirationTime, totalTime }
})
const timeRemaining = ref({ p: 1, s: '' })

async function collectArtwork() {
  if (!authStore.user) {
    alert('Please log in to collect artwork')
    return
  }
  try {
    const response = await artworkApi.collectArtwork(artwork.canvas_id, artwork.id)
    authStore.setProfileInfo(response.userProfile)
  } catch (error) {
    toast.error('Failed to collect artwork: ' + JSON.stringify(error))
  }
}

function updateTime() {
  const remainingMS = timeInfo.value.expirationTime - Date.now()
  if (remainingMS > 0) {
    const { hours, minutes, seconds } = getH_M_S(remainingMS)
    timeRemaining.value.p = remainingMS / timeInfo.value.totalTime
    timeRemaining.value.s = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  } else {
    timeRemaining.value.p = 0
    timeRemaining.value.s = 'Expired'
  }
}

let interval: number | undefined = undefined
onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 1000)
})
watch(() => artwork, updateTime)
onScopeDispose(() => {
  clearInterval(interval)
})
</script>
