<template>
  <div
    class="fixed flex items-center top-0 left-0 rounded-br-md backdrop-blur-xl text-primary bg-black/50 z-10 font-bold"
  >
    <button @click="drawerRef?.openDrawer" class="p-2 cursor-pointer hover:bg-neutral-800">
      <div class="size-5"><MenuIcon /></div>
    </button>
    <router-link to="/" class="px-2"> YouDroppedThis </router-link>
  </div>
  <div class="fixed top-0 right-0 p-2 z-20">
    <ProfileButton />
  </div>
  <CanvasView v-bind="props" />
  <Drawer ref="drawer" :canvas-id="props.canvasId" />
</template>

<script setup lang="ts">
import { watch, useTemplateRef, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import MenuIcon from '@/assets/icons/menu.svg'
import ProfileButton from '@/components/User/ProfileButton.vue'
import Drawer from '@/components/Layout/Drawer.vue'
import CanvasView from './CanvasView.vue'

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')

const route = useRoute()

const props = ref<{ canvasId: number; x: number; y: number; z?: number; selected?: boolean }>({
  canvasId: 1,
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
