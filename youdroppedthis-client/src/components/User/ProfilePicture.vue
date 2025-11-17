<template>
  <div
    v-if="profile"
    class="rounded-full size-[1.4em] aspect-square text-white text-center"
    :style="{ background: profile.profile_picture?.palette[0] }"
  >
    {{ profile.username.charAt(0) }}
  </div>
  <div v-else class="bg-neutral-700 animate-pulse rounded-full size-6" />
</template>

<script setup lang="ts">
import type { Profile } from '@/shared/types'
import type { DeepReadonly } from 'vue'

const { profile } = defineProps<{ profile?: DeepReadonly<Profile> }>()
</script>
