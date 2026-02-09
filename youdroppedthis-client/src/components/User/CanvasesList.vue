<template>
  <template v-for="page in data?.pages">
    <router-link
      v-for="canvasInfo in page.canvases"
      :to="`/c/${canvasInfo.id}`"
      class="flex gap-3 items-center text-left px-2 py-1 rounded-lg hover:bg-neutral-800 text-sm max-w-full"
      :key="canvasInfo.id"
    >
      <div
        class="rounded-full size-4 shrink-0 bg-zinc-900"
        :style="{ backgroundColor: canvasInfo.background_color }"
      />
      <div class="min-w-20">
        <div
          :class="[
            { 'font-semibold': canvasInfo.id === props.activeCanvasId },
            'whitespace-nowrap overflow-hidden text-ellipsis',
          ]"
        >
          {{ canvasInfo.name }}
        </div>
      </div>
      <span
        :class="[
          canvasInfo.end_at > now ? 'rounded-full bg-primary' : 'bg-secondary',
          'size-1.5 inline-block shrink-0 ml-auto',
        ]"
      />
    </router-link>
  </template>
  <button
    v-if="hasNextPage"
    @click="fetchNextPage()"
    :disabled="isFetchingNextPage"
    class="cursor-pointer disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-neutral-800 text-sm flex gap-3 items-center w-full border border-dashed text-neutral-400 border-neutral-600"
  >
    <div
      :class="[
        'size-4 rounded-full border-t-transparent',
        isFetchingNextPage ? 'animate-spin border-2' : '',
      ]"
    />
    {{ isFetchingNextPage ? 'Loading...' : `Load more` }}
  </button>
</template>

<script setup lang="ts">
import { useHostedCanvases } from '@/composables/useCanvases'
import { toRef } from 'vue'

const props = defineProps<{ userId: string; activeCanvasId?: number }>()

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useHostedCanvases(
  toRef(props, 'userId'),
)

const now = new Date().toISOString()
</script>
