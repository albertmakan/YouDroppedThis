<template>
  <div
    class="fixed flex gap-2 items-center top-0 left-0 rounded-br-md backdrop-blur-xl text-primary bg-black/50 p-2 z-10 font-bold"
  >
    <button @click="drawerRef?.openDrawer" class="size-5 cursor-pointer hover:bg-neutral-800">
      <MenuIcon />
    </button>
    YouDroppedThis
  </div>
  <div class="fixed top-0 right-0 p-2 z-20">
    <ProfileButton />
  </div>
  <CanvasView v-bind="props" />
  <Drawer ref="drawer" :canvas-id="props.canvasId" />
</template>

<script setup lang="ts">
import { watch, useTemplateRef, ref } from 'vue'
import ProfileButton from '@/components/User/ProfileButton.vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import Drawer from '../Layout/Drawer.vue'
import MenuIcon from '../Icons/MenuIcon.vue'
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
    props.value.canvasId = +id || 1
  },
  { immediate: true },
)

onBeforeRouteLeave((to, from) => {
  console.log('leaving route', to, from)
})
</script>
