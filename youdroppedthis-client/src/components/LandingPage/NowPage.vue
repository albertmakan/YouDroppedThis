<template>
  <div class="min-h-screen dotted-background">
    <Header @open-drawer="drawerRef?.openDrawer" />
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-2">Happening now</h1>
      <div class="my-10 gap-10 flex items-start justify-center flex-wrap">
        <CanvasCard v-for="canvas in data?.canvases" :canvas />
      </div>
    </div>
    <Drawer ref="drawer" />
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import Drawer from '@/components/Layout/Drawer.vue'
import Header from '@/components/Layout/Header.vue'
import { useAuthStore } from '@/stores/auth'
import { useNowActiveCanvases } from '@/composables/useCanvases'
import CanvasCard from '@/components/Canvas/CanvasCard.vue'

const { data } = useNowActiveCanvases()

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')
const authStore = useAuthStore()
</script>
