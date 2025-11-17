<template>
  <canvas
    :width="resolution"
    :height="resolution"
    class="size-full"
    style="image-rendering: pixelated"
    ref="canvasRef"
  />
</template>

<script setup lang="ts">
import type { Artwork } from '@/shared/types'
import { computed, onMounted, ref, type DeepReadonly } from 'vue'
import { renderArtwork } from './renderArtwork'

const { artwork } = defineProps<{ artwork: DeepReadonly<Pick<Artwork, 'pixels'>> }>()
const resolution = computed(() => artwork.pixels?.length || 1)
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const context = canvasRef.value!.getContext('2d')
  renderArtwork(artwork.pixels ?? [], context!)
})
</script>
