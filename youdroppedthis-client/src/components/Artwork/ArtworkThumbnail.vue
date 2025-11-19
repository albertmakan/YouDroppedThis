<template>
  <canvas
    :width="offscreenCanvas?.width"
    :height="offscreenCanvas?.height"
    class="size-full"
    style="image-rendering: pixelated"
    ref="canvasRef"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const { offscreenCanvas } = defineProps<{ offscreenCanvas?: OffscreenCanvas }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!offscreenCanvas) return
  const context = canvasRef.value!.getContext('2d')
  context?.drawImage(offscreenCanvas, 0, 0)
})
</script>
