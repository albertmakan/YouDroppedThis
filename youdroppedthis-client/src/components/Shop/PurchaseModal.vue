<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md mx-4">
      <h3 class="text-xl font-bold text-gray-900 mb-4">Confirm Purchase</h3>

      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <div class="flex justify-between mb-2">
          <span class="text-gray-600">Package:</span>
          <span class="font-semibold">{{ package.coins || package.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Price:</span>
          <span class="text-lg font-bold text-teal-600">${{ package.price }}</span>
        </div>
      </div>

      <p class="text-sm text-gray-600 mb-6">Are you sure you want to proceed with this purchase?</p>

      <div class="flex gap-3">
        <button @click="$emit('cancel')" :disabled="isLoading" class="btn btn-secondary flex-1">
          Cancel
        </button>
        <button @click="$emit('confirm')" :disabled="isLoading" class="btn btn-primary flex-1">
          {{ isLoading ? 'Processing...' : 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  package: any
  isLoading: boolean
}

defineProps<Props>()
defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
