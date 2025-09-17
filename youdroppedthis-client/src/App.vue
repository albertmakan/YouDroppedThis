<template>
  <main>
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCanvasStore } from '@/stores/canvas'

const authStore = useAuthStore()
const canvasStore = useCanvasStore()

onMounted(async () => {
  // Try to load user if token exists
  await authStore.loadUser()

  // Start WebSocket connection if authenticated
  if (authStore.isAuthenticated) {
    canvasStore.startWebSocketConnection()
  }
})
</script>
