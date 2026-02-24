<template>
  <div
    class="w-80 rounded-lg shrink-0 bg-zinc-900"
    :style="{ backgroundColor: canvas.background_color }"
  >
    <div class="bg-black/90 border border-neutral-600 border-b-0 rounded-t-lg p-2">
      <h3 class="line-clamp-1 mb-1" :title="canvas.name">{{ canvas.name }}</h3>
      <p v-if="canvas.created_by && canvas.host" class="text-xs text-neutral-400">
        <span class="inline-flex gap-1.5 items-center">
          <ProfilePicture :profile="canvas.host" />
          <span>{{ canvas.host?.username }}</span>
        </span>
      </p>
    </div>
    <router-link :to="`/c/${canvas.id}`">
      <div class="min-h-20 p-2 border-x border-dashed border-neutral-600 relative">
        <div class="flex gap-1 p-1 justify-center">
          <div
            v-for="color in canvas.palette"
            :style="{ background: color }"
            class="rounded-sm size-3"
          />
        </div>
        <div
          class="absolute bg-black/50 text-xs font-semibold bottom-1 right-1 w-fit px-1 rounded-sm"
        >
          {{ canvas.max_x - canvas.min_x + 1 }}×{{ canvas.max_y - canvas.min_y + 1 }} •
          {{ canvas.artwork_resolution }}px
        </div>
      </div>
    </router-link>
    <div class="bg-black/90 border border-neutral-600 border-t-0 rounded-b-lg p-2">
      <p class="text-[10px] text-neutral-400">
        last activity {{ formatRelativeTime(canvas.last_artwork_at || canvas.created_at) }}
      </p>
      <p class="text-[10px] text-neutral-400">
        <span class="inline-block size-1 rounded-full bg-primary mr-1.5" />{{
          canvas.active_artworks_count
        }}
        artworks
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CanvasInfo } from '@/shared/types'
import { formatRelativeTime } from '@/utils/datetime'
import ProfilePicture from '@/components/User/ProfilePicture.vue'

defineProps<{ canvas: CanvasInfo }>()
</script>
