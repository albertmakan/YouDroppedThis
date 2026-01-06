<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Purchase Coins</h2>
    <p class="text-neutral-400 mb-6">Get more coins to place artworks</p>
  </div>

  <div class="bg-black rounded-lg border border-neutral-600 p-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-neutral-400">Current Balance</p>
        <p class="text-3xl font-bold">{{ authStore.user?.balance }} coins</p>
      </div>
      <div class="text-6xl">💰</div>
    </div>
  </div>

  <div class="grid md:grid-cols-3 gap-4">
    <div
      v-for="pkg in coinPackages"
      :key="pkg.id"
      :class="[
        'relative bg-black rounded-lg border-2 p-6 cursor-pointer transition-all hover:border-neutral-400',
        selectedPackage === pkg.id ? 'border-neutral-400 bg-neutral-800' : 'border-neutral-600',
      ]"
      @click="selectedPackage = pkg.id"
      tabindex="0"
    >
      <div class="text-center">
        <div class="text-4xl mb-2">{{ pkg.icon }}</div>
        <div class="text-2xl font-bold mb-1">{{ pkg.coins }} coins</div>
        <div class="text-neutral-400 text-sm mb-4">
          <span class="line-through decoration-code-warn">${{ pkg.price }}</span>
          <span class="text-code-warn"> FREE </span>
        </div>

        <div class="text-xs text-neutral-500">
          ${{ (pkg.price / pkg.coins).toFixed(3) }} per coin
        </div>
      </div>
    </div>
  </div>

  <div class="pt-6">
    <button
      @click="purchaseCoins"
      :disabled="!selectedPackage || purchaseLoading"
      class="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      Purchase
      {{ selectedPackage ? coinPackages.find((p) => p.id === selectedPackage)?.coins : 0 }}
      Coins
    </button>
  </div>
</template>

<script setup lang="ts">
import { transactionApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const authStore = useAuthStore()

const selectedPackage = ref<number | null>(null)
const purchaseLoading = ref(false)

const coinPackages = [
  { id: 1, coins: 100, price: 0.99, icon: '💯' },
  { id: 2, coins: 500, price: 4.49, icon: '💎' },
  { id: 3, coins: 1000, price: 7.99, icon: '👑' },
]

async function purchaseCoins() {
  if (!selectedPackage.value) return
  const pkg = coinPackages.find((p) => p.id === selectedPackage.value)
  if (!pkg?.coins) return

  try {
    purchaseLoading.value = true
    const result = await transactionApi.purchaseCoins(pkg.coins)

    if (result.success && result.newBalance) {
      authStore.setProfileInfo({ balance: result.newBalance })
      toast.success(result.message)
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to purchase coins')
  } finally {
    selectedPackage.value = null
    purchaseLoading.value = false
  }
}
</script>
