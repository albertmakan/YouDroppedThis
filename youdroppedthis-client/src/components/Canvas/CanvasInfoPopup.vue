<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @mousedown="emit('close')">
    <div
      class="bg-black text-neutral-200 rounded-lg shadow-lg mx-auto my-4 w-fit border border-neutral-600"
      @mousedown.stop
    >
      <div class="flex w-full justify-between items-center gap-4 text-xl p-3">
        <h2>{{ canvas.name }}</h2>
        <button @click="emit('close')" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <div class="flex p-3 pt-0 border-b border-neutral-600">
        <span
          v-if="canvas.is_active"
          class="inline-block rounded-full py-1 px-3 bg-primary/30 text-xs"
        >
          Active
        </span>
        <span v-else class="inline-block rounded-full py-1 px-3 bg-amber-700/30 text-xs">
          Inactive
        </span>
      </div>

      <div class="h-[calc(100vh-160px)] max-w-96 overflow-y-auto p-6">
        <!-- Description -->
        <div v-if="canvas.description" class="mb-6">
          <p class="text-neutral-300 text-sm whitespace-pre-wrap">{{ canvas.description }}</p>
        </div>

        <!-- Stats Grid -->
        <div class="mb-6">
          <h3>Statistics</h3>
          <div class="grid sm:grid-cols-2 gap-3 my-3">
            <div class="flex items-center gap-3 rounded-md bg-neutral-900 p-3">
              <div class="text-2xl">🎨</div>
              <div class="flex-1">
                <div class="text-2xl font-medium">{{ canvas.total_artworks_placed }}</div>
                <div class="text-xs text-neutral-400">Total Placed</div>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-md bg-neutral-900 p-3">
              <div class="text-2xl">✨</div>
              <div class="flex-1">
                <div class="text-2xl font-medium">{{ canvas.active_artworks_count }}</div>
                <div class="text-xs text-neutral-400">Currently Active</div>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-md bg-neutral-900 p-3">
              <div class="text-2xl">📦</div>
              <div class="flex-1">
                <div class="text-2xl font-medium">{{ canvas.total_artworks_collected }}</div>
                <div class="text-xs text-neutral-400">Total Collected</div>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-md bg-neutral-900 p-3">
              <div class="text-2xl">💰</div>
              <div class="flex-1">
                <div class="text-2xl font-medium">{{ canvas.placement_fee }}</div>
                <div class="text-xs text-neutral-400">Placement Fee</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Canvas Properties -->
        <div class="mb-6">
          <h3>Canvas Properties</h3>
          <div
            class="flex flex-col gap-3 my-3 *:flex *:sm:flex-row *:sm:items-center *:flex-col *:justify-between *:items-start *:gap-1 *:p-3 *:bg-neutral-900 *:rounded-md"
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
              <span class="text-neutral-400 text-sm">Artwork Expiry</span>
              <span class="text-sm font-medium">{{ canvas.artwork_expiry_minutes }} minutes</span>
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Minimum Visibility</span>
              <span class="text-sm font-medium"
                >{{ canvas.min_visibility_minutes ?? 1 }} minutes</span
              >
            </div>

            <div>
              <span class="text-neutral-400 text-sm">Rate Limit</span>
              <span class="text-sm font-medium">
                {{ canvas.max_artworks_per_user_per_hour }} artworks/hour/user
              </span>
            </div>

            <div v-if="canvas.premium_zone_enabled">
              <span class="text-neutral-400 text-sm">Premium Zone</span>
              <span class="text-sm font-medium premium">
                <span class="">⭐ Enabled</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Theme & Style -->
        <div v-if="canvas.theme || canvas.background_color" class="mb-6">
          <h3>Appearance</h3>
          <div
            class="flex flex-col gap-3 my-3 *:flex *:sm:flex-row *:sm:items-center *:flex-col *:justify-between *:items-start *:gap-1 *:p-3 *:bg-neutral-900 *:rounded-md"
          >
            <div v-if="canvas.theme">
              <span class="text-neutral-400 text-sm">Theme</span>
              <span class="text-sm font-medium">{{ canvas.theme }}</span>
            </div>

            <div v-if="canvas.background_color">
              <span class="text-neutral-400 text-sm">Background</span>
              <span class="text-sm font-medium">
                <span
                  class="size-5 inline-block border rounded-md align-middle"
                  :style="{ background: canvas.background_color }"
                ></span>
                {{ canvas.background_color }}
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
          <div class="flex justify-between gap-2">
            <span>Last Updated</span>
            <span>{{ formatDate(canvas.updated_at || canvas.created_at) }}</span>
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

const canvasWidth = computed(() => (canvas.max_x || Infinity) - (canvas.min_x || -Infinity) + 1)
const canvasHeight = computed(() => (canvas.max_y || Infinity) - (canvas.min_y || -Infinity) + 1)
const totalCells = computed(() => canvasWidth.value * canvasHeight.value)

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
</script>
