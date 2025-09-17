<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div class="max-h-screen overflow-y-auto w-full">
      <div
        class="bg-neutral-800 text-neutral-200 rounded-lg shadow-lg flex flex-col items-center m-auto gap-4 p-4 w-fit"
        @click.stop
      >
        <div class="flex w-full justify-end text-2xl">
          <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
        </div>
        <div class="text-xl">{{ userStore.user?.username }}</div>
        <div class="grid grid-cols-4 gap-2">
          <div v-for="artwork in userStore.user?.artworks">
            <ArtworkThumbnail :artwork="artwork" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import ArtworkThumbnail from '../Artwork/ArtworkThumbnail.vue'
import XMarkIcon from '../Icons/XMarkIcon.vue'

const userStore = useAuthStore()

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

onMounted(() => {
  userStore.loadUserArtworks()
})
</script>
