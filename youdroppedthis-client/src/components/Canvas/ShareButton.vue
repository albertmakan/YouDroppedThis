<template>
  <span class="relative h-5">
    <button class="peer cursor-pointer size-5" @click="setCanvasUrl">
      <ShareIcon />
    </button>
    <div
      class="peer-focus:block hidden active:block focus:block focus-within:block absolute right-0 top-full bg-black rounded-lg w-fit shadow-md border border-neutral-600 mt-1 p-2"
      tabindex="0"
    >
      <div class="flex items-center gap-2">
        <input
          type="text"
          class="text-xs border border-neutral-600 rounded-md p-1 w-48 sm:w-80"
          readonly
          :value="canvasUrl"
        />
        <button
          @click="copyCanvasUrlToClipboard"
          class="rounded-md hover:bg-neutral-800 transition-colors font-medium text-xs cursor-pointer size-5 shrink-0"
        >
          <CheckmarkIcon v-if="copied" /><CopyIcon v-else />
        </button>
      </div>
    </div>
  </span>
</template>

<script setup lang="ts">
import ShareIcon from '@/assets/icons/share.svg'
import CopyIcon from '@/assets/icons/copy.svg'
import CheckmarkIcon from '@/assets/icons/checkmark.svg'
import { ref } from 'vue'

const props = defineProps<{
  canvasId: number
  x: number
  y: number
  z?: number
}>()

const canvasUrl = ref('')
const copied = ref(false)

function copyCanvasUrlToClipboard() {
  navigator.clipboard.writeText(canvasUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 3000)
}

function setCanvasUrl() {
  const { protocol, host } = location
  canvasUrl.value = `${protocol}//${host}/c/${props.canvasId}?x=${props.x.toFixed(2)}&y=${props.y.toFixed(2)}&z=${(props.z || 1).toFixed(2)}`
}
</script>
