<template>
  <main>
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCanvasStore } from '@/stores/canvas'

const authStore = useAuthStore()
const canvasStore = useCanvasStore()

onMounted(async () => {
  // Try to load user if token exists
  await authStore.loadUser()
})

watch(
  () => authStore.isAuthenticated,
  async () => {
    if (authStore.isAuthenticated) {
      canvasStore.startWebSocketConnection()
    } else {
      canvasStore.stopWebSocketConnection()
    }
  },
)
</script>
