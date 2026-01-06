import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { transactionApi } from '@/services/api'
import type { Profile } from '@/shared/types'
import type { Ref } from 'vue'

export const ITEMS_PER_PAGE = 20

export function useUserTransactions(userId?: Ref<string | undefined>) {
  return useInfiniteQuery({
    queryKey: ['transactions', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await transactionApi.getTransactions(pageParam, ITEMS_PER_PAGE)
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.transactions.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined,
    enabled: !!userId?.value,
  })
}

export function useClaimDailyBonus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => transactionApi.claimDailyBonus(),
    onSuccess: (result) => {
      if (result.success && result.newBalance)
        queryClient.setQueryData(['profile', result.userId], (profile: Profile) => ({
          ...profile,
          balance: result.newBalance,
        }))
    },
  })
}
