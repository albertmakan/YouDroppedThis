<template>
  <div
    class="bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-shadow flex flex-col"
    :class="tier.featured ? 'border-teal-500 ring-2 ring-teal-100 scale-105' : 'border-gray-200'"
  >
    <!-- Featured Badge -->
    <div
      v-if="tier.featured"
      class="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold"
    >
      MOST POPULAR
    </div>

    <!-- Title -->
    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ tier.name }}</h3>

    <!-- Price -->
    <div class="mb-6">
      <p class="text-3xl font-bold text-gray-900">
        ${{ tier.price }}<span class="text-lg text-gray-600">/mo</span>
      </p>
    </div>

    <!-- Coins -->
    <div class="mb-6 p-4 bg-teal-50 rounded-lg">
      <p class="text-sm text-gray-600">Monthly coins</p>
      <p class="text-2xl font-bold text-teal-600">{{ tier.coins }} 🪙</p>
    </div>

    <!-- Features -->
    <ul class="mb-6 space-y-3 flex-1">
      <li
        v-for="feature in tier.features"
        :key="feature"
        class="flex items-start text-sm text-gray-700"
      >
        <span class="text-green-500 mr-2">✓</span>
        {{ feature }}
      </li>
    </ul>

    <!-- Subscribe Button -->
    <button
      @click="$emit('purchase')"
      :disabled="isLoading"
      class="btn w-full"
      :class="tier.featured ? 'btn-primary' : 'btn-secondary'"
    >
      {{ isLoading ? 'Processing...' : 'Subscribe' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tier: any
  isLoading: boolean
}

defineProps<Props>()
defineEmits<{
  purchase: []
}>()
</script>
