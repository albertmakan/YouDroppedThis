<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Transaction History</h2>
    <p class="text-neutral-400 mb-6">View all your transactions</p>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-neutral-600">
          <th class="text-left py-3 px-4 text-sm font-medium text-neutral-400">Date</th>
          <th class="text-left py-3 px-4 text-sm font-medium text-neutral-400">Type</th>
          <th class="text-left py-3 px-4 text-sm font-medium text-neutral-400">Description</th>
          <th class="text-right py-3 px-4 text-sm font-medium text-neutral-400">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="transaction in transactions"
          :key="transaction.id"
          class="border-b border-neutral-700 hover:bg-neutral-800 transition-colors"
        >
          <td class="py-3 px-4 text-sm">{{ formatDate(transaction.created_at) }}</td>
          <td class="py-3 px-4">
            <span
              :class="[
                'inline-block px-2 py-1 rounded text-xs font-medium',
                transaction.type === 'purchase' || transaction.type === 'bonus'
                  ? 'bg-green-950 text-green-200'
                  : transaction.type === 'spent' || transaction.type === 'placement'
                    ? 'bg-red-950 text-red-200'
                    : 'bg-neutral-700 text-neutral-200',
              ]"
            >
              {{ transaction.type }}
            </span>
          </td>
          <td class="py-3 px-4 text-sm">{{ transaction.description }}</td>
          <td
            :class="[
              'py-3 px-4 text-sm text-right font-medium',
              transaction.amount > 0 ? 'text-green-400' : 'text-red-400',
            ]"
          >
            {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="hasMore && transactions.length > 0" class="text-center pt-4">
    <button
      @click="loadMoreTransactions"
      :disabled="isLoading"
      class="cursor-pointer flex w-full gap-2 items-center justify-center disabled:cursor-not-allowed py-2 border border-dashed border-neutral-600"
    >
      <div
        v-if="isLoading"
        class="size-4 animate-spin rounded-full border-2 border-t-transparent"
      />
      {{ isLoading ? 'Loading...' : `Load more` }}
    </button>
  </div>

  <div v-if="!isLoading && transactions.length === 0" class="text-center py-12 text-neutral-400">
    No transactions yet
  </div>
</template>

<script setup lang="ts">
import { transactionApi } from '@/services/api'
import type { Transaction } from '@/shared/types'
import { onMounted, ref } from 'vue'

const transactions = ref<Transaction[]>([])
const page = ref(1)
const hasMore = ref(true)
const isLoading = ref(false)

const ITEMS_PER_PAGE = 8

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function loadTransactions(reset = false) {
  isLoading.value = true
  try {
    const pageNum = reset ? 1 : page.value
    const { transactions: loadedTransactions } = await transactionApi.getTransactions(
      pageNum,
      ITEMS_PER_PAGE,
    )

    if (reset) {
      transactions.value = loadedTransactions
      page.value = 1
    } else {
      transactions.value.push(...loadedTransactions)
    }
    hasMore.value = loadedTransactions.length === ITEMS_PER_PAGE
    page.value++
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadMoreTransactions() {
  if (!hasMore.value || isLoading.value) return
  await loadTransactions(false)
}

onMounted(async () => {
  await loadTransactions(true)
})
</script>
