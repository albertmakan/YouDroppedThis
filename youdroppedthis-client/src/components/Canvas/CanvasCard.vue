<template>
  <div
    class="w-80 rounded-lg shrink-0 bg-zinc-900"
    :style="{ backgroundColor: canvas.background_color }"
  >
    <div class="bg-black/90 border border-neutral-600 border-b-0 rounded-t-lg p-2">
      <h3 class="line-clamp-1" :title="canvas.name">{{ canvas.name }}</h3>
      <div
        class="text-xs text-neutral-400 line-clamp-1 whitespace-pre-wrap"
        ref="description"
        @click="descriptionRef!.classList.toggle('line-clamp-1')"
      >
        {{ canvas.description }}
      </div>
    </div>
    <div class="min-h-20 p-2 border-x border-dashed border-neutral-600">
      <div class="flex gap-1 p-1 justify-center">
        <div
          v-for="color in canvas.palette"
          :style="{ background: color }"
          class="rounded-sm size-3"
        />
      </div>
    </div>
    <div class="bg-black/90 border border-neutral-600 border-t-0 rounded-b-lg p-2">
      <div class="text-[10px] text-neutral-400">
        last activity {{ formatRelativeTime(canvas.last_artwork_at) }}
      </div>
      <div class="text-center m-2">
        <router-link
          :to="`/c/${canvas.id}`"
          class="text-primary border px-2 py-1 rounded-lg text-nowrap uppercase"
          :key="canvas.id"
        >
          Enter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CanvasInfo } from '@/shared/types'
import { formatRelativeTime } from '@/utils/date'
import { useTemplateRef } from 'vue'

defineProps<{ canvas: CanvasInfo }>()
const descriptionRef = useTemplateRef<HTMLDivElement>('description')
</script>
