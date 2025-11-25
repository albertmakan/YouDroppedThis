<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50" @click="emit('close')">
    <div
      class="bg-black text-neutral-200 rounded-lg m-auto p-4 w-fit border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between items-center gap-4 text-2xl">
        Location
        <button @click="emit('close')" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <form @submit.prevent="handleJump">
        <div class="flex flex-wrap justify-center gap-4 my-4">
          <label>
            x:
            <input
              type="number"
              v-model="location.x"
              :min="props.minX"
              :max="props.maxX"
              class="bg-neutral-900 rounded-md p-1"
            />
          </label>
          <label>
            y:
            <input
              type="number"
              v-model="location.y"
              :min="props.minY"
              :max="props.maxY"
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
import XMarkIcon from '../Icons/XMarkIcon.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ minX?: number; maxX?: number; minY?: number; maxY?: number }>()

const router = useRouter()

const emit = defineEmits<{ close: [] }>()

const location = ref({ x: 0, y: 0, selected: '' })

function handleJump() {
  emit('close')
  router.push({ query: location.value })
}
</script>
