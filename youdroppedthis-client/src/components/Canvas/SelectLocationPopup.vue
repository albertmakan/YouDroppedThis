<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @click="closeModal">
    <div
      class="bg-black text-neutral-200 rounded-lg m-auto p-4 w-fit border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between items-center gap-4 text-2xl">
        Location
        <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <form @submit.prevent="handleJump">
        <div class="flex flex-wrap justify-center gap-4 my-4">
          <label>
            x:
            <input
              type="number"
              v-model="location.x"
              :min="canvasStore.canvasInfo?.min_x"
              :max="canvasStore.canvasInfo?.max_x"
              class="bg-neutral-900 rounded-md p-1"
            />
          </label>
          <label>
            y:
            <input
              type="number"
              v-model="location.y"
              name="y"
              :min="canvasStore.canvasInfo?.min_y"
              :max="canvasStore.canvasInfo?.max_y"
              class="bg-neutral-900 rounded-md p-1"
            />
          </label>
        </div>
        <div class="text-center">
          <button
            class="border-current border disabled:opacity-50 rounded-md px-2 py-1 cursor-pointer pointer-events-auto text-primary uppercase"
          >
            JUMP
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import XMarkIcon from '../Icons/XMarkIcon.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasStore = useCanvasStore()

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

const location = ref({ x: 0, y: 0, selected: '' })

function handleJump() {
  emit('close')
  router.push({ query: location.value })
}
</script>
