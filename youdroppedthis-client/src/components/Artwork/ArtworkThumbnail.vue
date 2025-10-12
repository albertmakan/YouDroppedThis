<template>
  <canvas :width="size" :height="size" class="size-full" ref="canvasRef" />
</template>

<script setup lang="ts">
import type { Artwork } from '@/shared/types'
import { onMounted, ref, type DeepReadonly } from 'vue'
import { renderArtwork } from './renderArtwork'
const size = 64

const { artwork } = defineProps<{ artwork: DeepReadonly<Artwork> }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const context = canvasRef.value!.getContext('2d')
  const resolution = artwork.resolution
  const pixelSize = size / resolution
  renderArtwork(artwork.pixels ?? [], context!, 0, 0, resolution, resolution, pixelSize)
})
</script>
