<template>
  <div class="fixed top-0 left-0 z-10">
    <button
      @click="drawerRef?.openDrawer"
      class="p-2 cursor-pointer rounded-br-md hover:bg-neutral-800 backdrop-blur-xl bg-black/50"
    >
      <div class="size-5"><MenuIcon /></div>
    </button>
  </div>
  <div class="fixed top-0 right-0 flex gap-3 p-2 items-center z-20">
    <ShareButton v-bind="props" />
    <ProfileButton :canvas-id="props.canvasId" />
  </div>
  <CanvasView v-bind="props" :user-id="authStore.user?.id" />
  <Drawer ref="drawer" :canvas-id="props.canvasId" />
</template>

<script setup lang="ts">
import { watch, useTemplateRef, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MenuIcon from '@/assets/icons/menu.svg'
import ProfileButton from '@/components/User/ProfileButton.vue'
import Drawer from '@/components/Layout/Drawer.vue'
import CanvasView from './CanvasView.vue'
import ShareButton from './ShareButton.vue'

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')

const route = useRoute()

const authStore = useAuthStore()

const props = ref<{
  canvasId: number
  x: number
  y: number
  z?: number
  selected?: boolean
}>({
  canvasId: 0,
  x: 0,
  y: 0,
})

watch(
  () => route.query,
  ({ x: qx, y: qy, z: qz, selected }) => {
    props.value.x = +(qx ?? '')
    props.value.y = +(qy ?? '')
    props.value.z = qz ? +qz : undefined
    props.value.selected = selected !== undefined
  },
  { deep: true, immediate: true },
)
watch(
  () => route.params.id,
  (id) => {
    props.value.canvasId = +id
  },
  { immediate: true },
)

onBeforeRouteLeave((to, from) => {
  console.log('leaving route', to, from)
})
</script>
