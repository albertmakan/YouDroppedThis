<template>
  <div class="min-h-screen dotted-background">
    <Header @open-drawer="drawerRef?.openDrawer" />
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-2">Happening now</h1>
      <div class="my-10 gap-10 flex items-start justify-center flex-wrap">
        <CanvasCard v-for="canvas in data?.canvases" :canvas />
        <template v-if="isLoading">
          <div
            v-for="i in 5"
            :key="i"
            class="bg-zinc-900 w-80 h-52 rounded-lg shrink-0 animate-pulse"
          ></div>
        </template>
      </div>
      <div v-if="data?.canvases.length === 0" class="text-center">
        <h2 class="text-2xl font-bold">Nothing is happening right now.</h2>
        <p class="text-neutral-400 my-4">Moments begin when someone hosts one.</p>
        <router-link
          v-if="authStore.isAuthenticated"
          to="/new"
          class="px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          Host a moment
        </router-link>
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

const { data, isLoading } = useNowActiveCanvases()

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')
const authStore = useAuthStore()
</script>
