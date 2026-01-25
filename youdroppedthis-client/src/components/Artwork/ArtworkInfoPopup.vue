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
        <ProfileCard :user-id="artwork.created_by" />
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
          v-if="isCollectable"
          @click="emit('collect')"
          @touchmove.prevent.passive
          class="cursor-pointer pointer-events-auto size-6"
          title="Keep this?"
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
import ProfileCard from '@/components/User/ProfileCard.vue'
import { getH_M_S } from '@/utils/date'

const { top, left, size, artwork } = defineProps<{
  top: number
  left: number
  size: number
  artwork: Artwork
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
  const remaining = timeRemaining.value.p
  return remaining < 0.05
    ? 'red'
    : remaining < 0.25
      ? 'orange'
      : remaining < 0.5
        ? 'yellow'
        : remaining < 0.75
          ? 'green'
          : 'darkgreen'
})
const isCollectable = ref(false)

function updateTime() {
  const now = Date.now()
  const remainingMS = timeInfo.value.expirationTime - now
  if (remainingMS > 0) {
    const { hours, minutes, seconds } = getH_M_S(remainingMS)
    timeRemaining.value.p = remainingMS / timeInfo.value.totalTime
    timeRemaining.value.s = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  } else {
    timeRemaining.value.p = 0
    timeRemaining.value.s = 'Expired'
  }
  isCollectable.value = timeInfo.value.collectableTime < now
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
