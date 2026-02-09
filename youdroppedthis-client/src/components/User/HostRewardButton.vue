<template>
  <button
    v-if="!claimed"
    @click="handleClaimBonus"
    class="inline-flex gap-3 items-center text-left px-3 py-3 rounded-lg *:text-primary hover:bg-neutral-800 transition-colors font-medium text-sm cursor-pointer"
  >
    <span class="size-5"><GiftIcon /></span>
    {{ isPending ? 'Claiming...' : 'Claim reward' }}
  </button>
  <p v-else-if="reward !== null">Reward of {{ reward }} coins claimed.</p>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useClaimHostReward } from '@/composables/useCanvases'
import GiftIcon from '@/assets/icons/gift.svg'

const props = defineProps<{ canvasId: number; claimed: boolean }>()

const { mutate: mutateClaimReward, isPending } = useClaimHostReward(toRef(props, 'canvasId'))

const toast = useToast()

const authStore = useAuthStore()

const reward = ref<number | null>(null)

async function handleClaimBonus() {
  mutateClaimReward(undefined, {
    onSuccess: (result) => {
      authStore.setProfileInfo(result.userProfile)
      reward.value = result.reward
      toast.success(`🎁 Reward of ${result.reward} claimed`)
    },
    onError: (error: any) => {
      const result = error.response?.data ?? {}
      toast.warning(result.message || 'Failed to claim host reward')
    },
  })
}

watch(
  () => props.canvasId,
  () => (reward.value = null),
)
</script>
