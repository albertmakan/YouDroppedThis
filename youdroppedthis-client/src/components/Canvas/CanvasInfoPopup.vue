<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @mousedown="emit('close')">
    <div
      class="bg-black rounded-lg shadow-lg mx-auto my-4 max-w-96 sm:w-96 border border-neutral-600"
      @mousedown.stop
    >
      <div class="flex w-full justify-between gap-4 p-3 border-b border-neutral-600">
        <div class="w-4/5">
          <h2 class="wrap-break-word mb-3">{{ canvas.name }}</h2>
          <p class="text-xs text-neutral-400">
            Hosted by
            <span class="inline-flex gap-[0.5em] items-center">
              <ProfilePicture :profile="canvas.host" />
              <span>{{ canvas.host?.username }}</span>
            </span>
          </p>
        </div>
        <button @click="emit('close')" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <div class="max-h-[calc(100vh-160px)] overflow-y-auto p-6">
        <!-- Description -->
        <p
          v-if="canvas.description"
          class="text-neutral-300 text-sm whitespace-pre-wrap mb-3 pb-6 border-b border-neutral-800"
        >
          {{ canvas.description }}
        </p>

        <p class="text-sm text-neutral-400 mb-2">
          <span
            :class="[
              canvas.end_at > now ? 'rounded-full bg-primary' : 'bg-secondary',
              'size-2 inline-block',
            ]"
          />
          This moment {{ canvas.accepting_artworks ? 'is active' : 'has ended' }}
        </p>

        <p class="text-sm text-neutral-300 mb-2">
          Art stays visible for
          <span class="font-semibold text-neutral-200">
            {{ canvas.artwork_expiry_minutes }} minutes
          </span>
        </p>
        <p class="text-sm text-neutral-300 mb-6">
          Collectable after
          <span class="font-semibold text-neutral-200">
            {{ canvas.min_visibility_minutes }} minutes
          </span>
        </p>

        <!-- Timestamps -->
        <div class="pt-2 text-xs text-neutral-400 border-t border-neutral-800">
          <div class="flex justify-between gap-2">
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
import XMarkIcon from '@/assets/icons/xmark.svg'
import type { CanvasInfo } from '@/shared/types'
import ProfilePicture from '@/components/User/ProfilePicture.vue'

const { canvas } = defineProps<{ canvas: CanvasInfo }>()

const emit = defineEmits<{ close: [] }>()

const now = new Date().toISOString()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
</script>
