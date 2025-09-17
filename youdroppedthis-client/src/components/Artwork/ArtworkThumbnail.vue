<template>
  <canvas :width="size" :height="size" class="size-full" ref="canvasRef" />
</template>

<script setup lang="ts">
import type { Artwork } from '@/shared/types'
import { computed, onMounted, ref, type DeepReadonly } from 'vue'
const size = 64

const { artwork } = defineProps<{ artwork: DeepReadonly<Artwork> }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const context = canvasRef.value!.getContext('2d')
  const pixelSize = size / artwork.resolution
  try {
    const pixels = computed(
      () =>
        artwork.pixels ||
        (artwork.pixel_data.startsWith('[[')
          ? (JSON.parse(artwork.pixel_data) as string[][])
          : Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => '#ffffff'))),
    )

    for (let pixelY = 0; pixelY < artwork.resolution; pixelY++) {
      for (let pixelX = 0; pixelX < artwork.resolution; pixelX++) {
        context!.fillStyle = pixels.value[pixelY][pixelX] || 'transparent'
        context!.fillRect(
          pixelX * pixelSize,
          pixelY * pixelSize,
          pixelSize + (pixelX === artwork.resolution - 1 ? 0 : 1),
          pixelSize + (pixelY === artwork.resolution - 1 ? 0 : 1),
        )
      }
    }
  } catch (e) {
    console.error(e)
  }
})
</script>
