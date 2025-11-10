<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px] max-w-md font-mono text-sm',
            toastStyles[toast.type],
          ]"
        >
          <span class="text-xl">{{ toastIcons[toast.type] }}</span>
          <span class="flex-1 text-neutral-200">{{ toast.message }}</span>
          <button
            @click="remove(toast.id)"
            class="text-neutral-400 hover:text-neutral-200 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const toastStyles = {
  success: 'border-green-600 bg-green-950',
  error: 'border-red-600 bg-red-950',
  info: 'border-neutral-600 bg-neutral-900',
  warning: 'border-yellow-600 bg-yellow-950',
}

const toastIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
</style>
