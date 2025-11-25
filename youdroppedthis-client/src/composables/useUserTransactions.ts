import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { transactionApi } from '@/services/api'
import type { Profile } from '@/shared/types'

export const ITEMS_PER_PAGE = 20

export function useUserTransactions() {
  return useInfiniteQuery({
    queryKey: ['transactions'],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await transactionApi.getTransactions(pageParam, ITEMS_PER_PAGE)
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.transactions.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined,
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
