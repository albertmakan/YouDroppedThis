<template>
  <button
    @click="handleClaimBonus"
    :disabled="bonusLoading || !canClaimBonus"
    class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
    :class="canClaimBonus ? 'bg-primary/20 text-primary' : 'opacity-50 cursor-not-allowed'"
  >
    <span class="size-5"><GiftIcon /></span>
    {{ bonusLoading ? 'Claiming...' : 'Daily bonus' }}
  </button>
</template>

<script setup lang="ts">
import { transactionApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'
import GiftIcon from '../Icons/GiftIcon.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const authStore = useAuthStore()
const bonusLoading = ref(false)
const lastBonusTime = ref<string | null>(localStorage.getItem('last_bonus_claim'))

const canClaimBonus = computed(() => {
  if (!lastBonusTime.value) return true

  const lastClaim = new Date(lastBonusTime.value)
  const now = new Date()
  const daysPassed = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24)

  return daysPassed >= 1
})

async function handleClaimBonus() {
  try {
    bonusLoading.value = true
    const result = await transactionApi.claimDailyBonus()

    if (result.success && result.newBalance) {
      authStore.setProfileInfo({ balance: result.newBalance })
      lastBonusTime.value = new Date().toISOString()
      localStorage.setItem('last_bonus_claim', lastBonusTime.value)
      toast.success(`🎁 ${result.message}`)
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to claim bonus')
  } finally {
    bonusLoading.value = false
  }
}
</script>
