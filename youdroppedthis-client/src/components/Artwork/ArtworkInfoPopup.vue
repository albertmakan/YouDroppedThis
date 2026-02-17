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
        <span class="inline-flex gap-[0.5em] items-center">
          <ProfilePicture :profile="artwork.creator" />
          <span>{{ artwork.creator?.username }}</span>
        </span>
        <div class="relative h-6">
          <button class="size-6 text-neutral-700 cursor-pointer peer">
            <svg viewBox="-1 -1 2 2" class="-rotate-90">
              <circle r="0.95" cx="0" cy="0" :fill="color" />
              <path
                :d="`M 1 0
                    A 1 1 0 ${timeRemaining.p > 0.5 ? 0 : 1} 1 ${Math.cos(2 * Math.PI * (1 - timeRemaining.p))} ${Math.sin(2 * Math.PI * (1 - timeRemaining.p))}
                    L 0 0`"
                fill="currentColor"
              />
            </svg>
          </button>
          <div
            class="peer-focus:block hidden active:block absolute top-full left-1/2 -translate-x-1/2 p-1 mt-0.5 bg-black rounded-md text-neutral-200 text-sm shadow-md border border-neutral-600 pointer-events-none"
          >
            {{ timeRemaining.s }}
          </div>
        </div>
      </div>

      <div
        class="absolute top-full left-1/2 -translate-x-1/2 min-w-full box-content bg-black/90 backdrop-blur-sm rounded-lg flex justify-center p-2 border border-neutral-600"
      >
        <button
          v-if="authStore.user && artwork.created_by !== authStore.user?.id"
          @click="emit('collect')"
          @touchmove.prevent.passive
          :disabled="!isCollectable || collectCooldownMinutesLeft > 0 || collectDisabled"
          class="disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer pointer-events-auto size-6 shrink-0"
          :title="collectTooltip"
        >
          <CollectIcon />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import type { Artwork } from '@/shared/types'
import CollectIcon from '@/assets/icons/collect.svg'
import ProfilePicture from '@/components/User/ProfilePicture.vue'
import { getH_M_S } from '@/utils/datetime'
import { useAuthStore } from '@/stores/auth'
const COLLECTION_COOLDOWN_MINUTES = 720

const authStore = useAuthStore()

const { top, left, size, artwork, collectDisabled } = defineProps<{
  top: number
  left: number
  size: number
  artwork: Artwork
  collectDisabled?: boolean
}>()

const emit = defineEmits<{
  collect: []
}>()

const timeInfo = computed(() => {
  const expirationTime = new Date(artwork.expires_at).getTime()
  const totalTime = expirationTime - new Date(artwork.created_at).getTime()
  const collectableTime = artwork.collectable_after
    ? new Date(artwork.collectable_after).getTime()
    : 0
  return { expirationTime, totalTime, collectableTime }
})
const timeRemaining = ref({ p: 1, s: '' })
const color = computed(() => {
  const t = 1 - timeRemaining.value.p
  // Teal: #14b8a6 (rgb: 20, 184, 166)
  // Amber: #f59e0b (rgb: 245, 158, 11)
  // Interpolate from teal (high remaining) to amber (low remaining)
  const r = Math.round(20 + (245 - 20) * t)
  const g = Math.round(184 + (158 - 184) * t)
  const b = Math.round(166 + (11 - 166) * t)
  return `rgb(${r}, ${g}, ${b})`
})
const isCollectable = ref(false)
const collectCooldownMinutesLeft = ref(COLLECTION_COOLDOWN_MINUTES)

function updateTime() {
  const now = Date.now()
  const remainingMS = timeInfo.value.expirationTime - now
  if (remainingMS > 0) {
    const { hours, minutes, seconds } = getH_M_S(remainingMS)
    timeRemaining.value.p = remainingMS / timeInfo.value.totalTime
    timeRemaining.value.s = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  } else {
    timeRemaining.value.p = 0
    timeRemaining.value.s = ''
  }
  isCollectable.value = timeInfo.value.collectableTime < now
  if (authStore.user && isCollectable.value) {
    collectCooldownMinutesLeft.value = authStore.user.last_collected_at
      ? COLLECTION_COOLDOWN_MINUTES -
        (now - new Date(authStore.user.last_collected_at).getTime()) / 60_000
      : (collectCooldownMinutesLeft.value = 0)
  }
}

const collectTooltip = computed(() => {
  if (!authStore.user) return `Please sign in to collect`
  if (!isCollectable.value) return `Collectable after it’s been here for a while`
  if (collectCooldownMinutesLeft.value > 0)
    return `You can collect again in about ${Math.round(collectCooldownMinutesLeft.value)} minutes`
  if (collectDisabled) return `You’ve already collected something from this moment`
  return `Keep this?`
})

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
