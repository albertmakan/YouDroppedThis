<template>
  <div class="min-h-screen bg-black text-neutral-200">
    <header class="flex justify-between">
      <div class="flex gap-2 items-center text-primary p-2 font-bold">
        <button class="size-5 cursor-pointer hover:bg-neutral-800">
          <MenuIcon />
        </button>
        <router-link to="/"> YouDroppedThis </router-link>
      </div>
      <div class="p-2 pb-0 z-10">
        <ProfileButton />
      </div>
    </header>
    <div class="max-w-6xl mx-auto p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Profile Settings</h1>
        <p class="text-neutral-400">Manage your account and preferences</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-4">
        <nav
          class="bg-black rounded-lg border border-neutral-600 lg:w-52 w-full h-fit sticky top-4"
        >
          <div class="mask-x-from-80% lg:mask-none">
            <div class="overflow-x-auto">
              <ul class="flex lg:flex-col text-nowrap gap-2 p-2">
                <li>
                  <router-link
                    to="general"
                    :class="[
                      'w-full text-left px-4 py-2 rounded-lg transition-colors inline-block',
                      route.params.tab === 'general'
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                    ]"
                  >
                    General
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="account"
                    :class="[
                      'w-full text-left px-4 py-2 rounded-lg transition-colors inline-block',
                      route.params.tab === 'account'
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                    ]"
                  >
                    Account
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="transactions"
                    :class="[
                      'w-full text-left px-4 py-2 rounded-lg transition-colors inline-block',
                      route.params.tab === 'transactions'
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                    ]"
                  >
                    Transactions
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="purchase"
                    :class="[
                      'w-full text-left px-4 py-2 rounded-lg transition-colors inline-block',
                      route.params.tab === 'purchase'
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                    ]"
                  >
                    Purchase Coins
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div class="rounded-lg border border-neutral-600 p-6 flex-1">
          <GeneralSettingsView v-if="route.params.tab === 'general'" />
          <AccountSettingsView v-else-if="route.params.tab === 'account'" />
          <TransactionsTable v-else-if="route.params.tab === 'transactions'" />
          <PurchaseView v-else-if="route.params.tab === 'purchase'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import GeneralSettingsView from './GeneralSettingsView.vue'
import AccountSettingsView from './AccountSettingsView.vue'
import TransactionsTable from './TransactionsTable.vue'
import PurchaseView from './PurchaseView.vue'
import MenuIcon from '@/components/Icons/MenuIcon.vue'
import ProfileButton from '../ProfileButton.vue'

const route = useRoute()
</script>
