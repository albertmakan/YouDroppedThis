<template>
  <div
    :class="[
      'relative min-w-64 p-3 pr-11 rounded-lg bg-black border border-l-4 border-neutral-600 border-l-current pointer-events-auto',
      type,
    ]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <span class="text-sm text-neutral-200 whitespace-pre-wrap">{{ message }}</span>
    <button
      @click="emit('close')"
      class="absolute top-0 right-0 m-3 size-5 text-neutral-200 cursor-pointer opacity-50 hover:opacity-100"
    >
      <XMarkIcon />
    </button>
    <div class="absolute bottom-0 left-0 right-0 h-1">
      <div
        class="h-full bg-current"
        :style="{
          width: `${progress}%`,
          animationPlayState: isPaused ? 'paused' : 'running',
          transition: 'width 0.1s linear',
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import XMarkIcon from '@/assets/icons/xmark.svg'

const props = withDefaults(
  defineProps<{
    message: string
    duration?: number // in milliseconds
    type?: 'info' | 'success' | 'warning' | 'error'
  }>(),
  { duration: 5000, type: 'info' },
)

const emit = defineEmits<{ close: [] }>()

const progress = ref(100)
const isPaused = ref(false)
const remainingTime = ref(props.duration)
let animationFrame: number
let lastTimestamp: number

function updateProgress(timestamp: number) {
  if (isPaused.value) {
    lastTimestamp = timestamp
    animationFrame = requestAnimationFrame(updateProgress)
    return
  }
  if (!lastTimestamp) {
    lastTimestamp = timestamp
  }
  const elapsed = timestamp - lastTimestamp
  remainingTime.value = Math.max(0, remainingTime.value - elapsed)
  progress.value = (remainingTime.value / props.duration) * 100
  if (remainingTime.value > 0) {
    lastTimestamp = timestamp
    animationFrame = requestAnimationFrame(updateProgress)
    return
  }
  emit('close')
}

onMounted(() => {
  animationFrame = requestAnimationFrame(updateProgress)
})

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>
