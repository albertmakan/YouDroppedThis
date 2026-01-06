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
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useClaimDailyBonus } from '@/composables/useUserTransactions'
import GiftIcon from '@/assets/icons/gift.svg'
import type { TransactionResult } from '@/services/api'

const lastBonusTimeKey = (userId?: string) => 'last_bonus_claim_' + userId

const { mutate: mutateClaimDailyBonus, isPending: bonusLoading } = useClaimDailyBonus()

const toast = useToast()

const authStore = useAuthStore()
const lastBonusTime = ref<string | null>(localStorage.getItem(lastBonusTimeKey(authStore.user?.id)))

const canClaimBonus = computed(() => {
  if (!lastBonusTime.value) return true
  const daysPassed = (Date.now() - new Date(lastBonusTime.value).getTime()) / (1000 * 60 * 60 * 24)
  return daysPassed >= 1
})

async function handleClaimBonus() {
  mutateClaimDailyBonus(undefined, {
    onSuccess: (result) => {
      if (result.success && result.newBalance) {
        authStore.setProfileInfo({ balance: result.newBalance })
        toast.success(`🎁 ${result.message}`)
      } else {
        toast.warning(result.message)
      }
      lastBonusTime.value = result.claimedAt
      localStorage.setItem(lastBonusTimeKey(result.userId), lastBonusTime.value)
    },
    onError: (error: any) => {
      const result = (error.response?.data ?? {}) as TransactionResult
      toast.warning(result.message || 'Failed to claim bonus')
      lastBonusTime.value = result.claimedAt
      localStorage.setItem(lastBonusTimeKey(result.userId), lastBonusTime.value)
    },
  })
}
</script>
