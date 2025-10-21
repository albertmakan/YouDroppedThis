<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @click="closeModal">
    <div
      class="bg-black text-neutral-200 rounded-lg m-auto p-4 w-fit border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between items-center gap-4 text-2xl">
        Canvas stats
        <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <div>size: {{ CANVAS_SIZE }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CANVAS_SIZE } from '@/stores/canvas'
import XMarkIcon from '../Icons/XMarkIcon.vue'

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}
</script>
