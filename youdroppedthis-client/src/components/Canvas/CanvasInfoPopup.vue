<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @mousedown="emit('close')">
    <div
      class="bg-black rounded-lg shadow-lg mx-auto my-4 w-fit border border-neutral-600"
      @mousedown.stop
    >
      <div
        class="flex w-full justify-between items-center gap-4 text-xl p-3 border-b border-neutral-600"
      >
        <h2>{{ canvas.name }}</h2>
        <button @click="emit('close')" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <div class="h-[calc(100vh-160px)] max-w-96 overflow-y-auto p-6">
        <!-- Description -->
        <div v-if="canvas.description" class="mb-6">
          <p class="text-neutral-300 text-sm whitespace-pre-wrap">{{ canvas.description }}</p>
        </div>

        <!-- Canvas Properties -->
        <div class="mb-6">
          <h3>Canvas Properties</h3>
          <div
            class="flex flex-col gap-3 my-3 *:flex *:sm:flex-row *:sm:items-center *:flex-col *:justify-between *:items-start *:gap-x-3 *:p-3 *:bg-neutral-900 *:rounded-md"
          >
            <div>
              <span class="text-neutral-400 text-sm">Canvas Size</span>
              <span class="text-sm font-medium">
                {{ canvasWidth }}×{{ canvasHeight }} ({{ totalCells.toLocaleString() }} cells)
              </span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Coordinates</span>
              <span class="text-sm font-medium">
                x: {{ canvas.min_x || -Infinity }} to {{ canvas.max_x || Infinity }}
                <br />
                y: {{ canvas.min_y || -Infinity }} to {{ canvas.max_y || Infinity }}
              </span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Placement Fee</span>
              <span class="text-sm font-medium"> {{ canvas.placement_fee }} coins </span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Artwork Expiry</span>
              <span class="text-sm font-medium">{{ canvas.artwork_expiry_minutes }} minutes</span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Minimum Visibility</span>
              <span class="text-sm font-medium">{{ canvas.min_visibility_minutes }} minutes</span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Rate Limit</span>
              <span class="text-sm font-medium">
                {{ canvas.max_artworks_per_user_per_hour }} artworks/hour/user
              </span>
            </div>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="pt-4 text-xs text-neutral-400">
          <div class="flex justify-between gap-2 mb-2">
            <span>Created</span>
            <span>{{ formatDate(canvas.created_at) }}</span>
          </div>
          <div v-if="canvas.first_artwork_at" class="flex justify-between gap-2">
            <span>First Placement</span>
            <span>{{ formatDate(canvas.first_artwork_at) }}</span>
          </div>
          <div v-if="canvas.last_artwork_at" class="flex justify-between gap-2">
            <span>Last Placement</span>
            <span>{{ formatDate(canvas.last_artwork_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import XMarkIcon from '@/assets/icons/xmark.svg'
import type { CanvasInfo } from '@/shared/types'

const { canvas } = defineProps<{ canvas: CanvasInfo }>()

const emit = defineEmits<{ close: [] }>()

const canvasWidth = computed(() => canvas.max_x - canvas.min_x + 1)
const canvasHeight = computed(() => canvas.max_y - canvas.min_y + 1)
const totalCells = computed(() => canvasWidth.value * canvasHeight.value)

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
</script>
