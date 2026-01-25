<template>
  <template v-for="page in data?.pages">
    <router-link
      v-for="canvasLink in page.canvases"
      :to="`/c/${canvasLink.id}`"
      class="flex gap-3 items-center text-left px-3 py-1 rounded-lg hover:bg-neutral-800 text-sm"
      :key="canvasLink.id"
    >
      <div
        class="rounded-full size-4 bg-zinc-900"
        :style="{ backgroundColor: canvasLink.background_color }"
      />
      <span :class="{ 'font-semibold': canvasLink.id === props.activeCanvasId }">
        {{ canvasLink.name }}
      </span>
    </router-link>
  </template>
</template>

<script setup lang="ts">
import { useHostedCanvases } from '@/composables/useCanvases'
import { toRef } from 'vue'

const props = defineProps<{ userId: string; activeCanvasId?: number }>()

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useHostedCanvases(
  toRef(props, 'userId'),
)
</script>
