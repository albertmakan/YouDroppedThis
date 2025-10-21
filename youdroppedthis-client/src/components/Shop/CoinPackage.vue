<template>
  <div
    class="bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-shadow"
    :class="package.featured ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200'"
  >
    <!-- Featured Badge -->
    <div
      v-if="package.featured"
      class="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold"
    >
      BEST VALUE
    </div>

    <!-- Price -->
    <div class="mb-4">
      <p class="text-3xl font-bold text-gray-900">${{ package.price }}</p>
      <p class="text-sm text-gray-600">{{ package.bestFor }}</p>
    </div>

    <!-- Coins -->
    <div class="mb-6 p-4 bg-teal-50 rounded-lg">
      <p class="text-sm text-gray-600 mb-1">You get</p>
      <p class="text-2xl font-bold text-teal-600">{{ package.coins }} 🪙</p>
      <p v-if="package.bonus > 0" class="text-xs text-green-600 mt-1">
        + {{ package.bonus }} bonus coins!
      </p>
    </div>

    <!-- Purchase Button -->
    <button @click="$emit('purchase')" :disabled="isLoading" class="btn btn-primary w-full">
      {{ isLoading ? 'Processing...' : 'Buy Now' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  package: any
  isLoading: boolean
}

defineProps<Props>()
defineEmits<{
  purchase: []
}>()
</script>
