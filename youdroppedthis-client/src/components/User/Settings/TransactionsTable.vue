<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Transaction History</h2>
    <p class="text-neutral-400 mb-6">View all your transactions</p>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-neutral-600 text-sm text-neutral-400">
          <th class="text-left py-3 px-4 font-medium">Date</th>
          <th class="text-left py-3 px-4 font-medium">Type</th>
          <th class="text-right py-3 px-4 font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="page in data?.pages">
          <tr
            v-for="transaction in page.transactions"
            :key="transaction.id"
            class="border-b border-neutral-700 hover:bg-neutral-900 transition-colors"
          >
            <td class="py-3 px-4 text-sm">{{ formatDateTime(transaction.created_at) }}</td>
            <td class="py-3 px-4">
              <span class="">
                {{ typeLabels[transaction.type] }}
              </span>
            </td>
            <td
              :class="[
                'py-3 px-4 text-sm text-right font-medium',
                transaction.amount > 0 ? 'text-primary' : 'text-secondary',
              ]"
            >
              {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <div v-if="hasNextPage" class="text-center pt-4">
    <button
      @click="fetchNextPage()"
      :disabled="isFetchingNextPage"
      class="cursor-pointer flex w-full gap-2 items-center justify-center disabled:cursor-not-allowed py-2 border border-dashed border-neutral-600"
    >
      <div
        v-if="isFetchingNextPage"
        class="size-4 animate-spin rounded-full border-2 border-t-transparent"
      />
      {{ isFetchingNextPage ? 'Loading...' : `Load more` }}
    </button>
  </div>

  <div
    v-if="!isFetching && !data?.pages[0].transactions.length"
    class="text-center py-12 text-neutral-400"
  >
    No transactions yet
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { formatDateTime } from '@/utils/datetime'
import { useUserTransactions } from '@/composables/useUserTransactions'

const typeLabels = {
  drop_fee: 'Drop fee',
  collection_reward: 'Collection reward',
  daily_grant: 'Daily grant',
  host_reward: 'Host reward',
  canvas_creation: 'Canvas creation',
  purchase: 'Purchase',
} as const

const props = defineProps<{ userId: string }>()

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useUserTransactions(
  toRef(props, 'userId'),
)
</script>
