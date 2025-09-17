<template>
  <svg viewBox="-1 -1 2 2" class="-rotate-90">
    <circle r="1" cx="0" cy="0" :fill="color" />
    <path
      :d="`M 1 0
           A 1 1 0 ${remaining > 0.5 ? 0 : 1} 1 ${Math.cos(2 * Math.PI * (1 - remaining))} ${Math.sin(2 * Math.PI * (1 - remaining))}
           L 0 0`"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { remaining } = defineProps<{ remaining: number }>()
const color = computed(() =>
  remaining < 0.05
    ? 'red'
    : remaining < 0.25
      ? 'orange'
      : remaining < 0.5
        ? 'yellow'
        : remaining < 0.75
          ? 'green'
          : 'darkgreen',
)
</script>
