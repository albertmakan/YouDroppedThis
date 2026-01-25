<template>
  <div
    v-if="profile"
    class="rounded-full size-[1.4em] aspect-square text-center"
    :style="{ background, color }"
  >
    {{ profile.username?.charAt(0) }}
  </div>
  <div v-else class="bg-neutral-700 animate-pulse rounded-full size-6" />
</template>

<script setup lang="ts">
import type { Profile } from '@/shared/types'
import { colorToRGBA, rgbToHSL } from '@/utils/color'
import { computed, type DeepReadonly } from 'vue'

const { profile } = defineProps<{
  profile?: DeepReadonly<Pick<Profile, 'username' | 'profile_picture'>>
}>()

const background = computed(() => profile?.profile_picture?.palette[0])

const color = computed(() => {
  if (!background.value) return
  const [r, g, b] = colorToRGBA(background.value)
  const [h, s, l] = rgbToHSL(r, g, b)
  return `hsl(${h}, ${s}%, ${l + (l > 50 ? -50 : 50)}%)`
})
</script>
