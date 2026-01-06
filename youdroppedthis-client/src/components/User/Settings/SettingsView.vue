<template>
  <div class="min-h-screen bg-black">
    <header class="flex justify-between items-start sticky top-0 bg-black z-10">
      <div class="flex items-center text-primary font-bold">
        <button @click="drawerRef?.openDrawer" class="p-2 cursor-pointer hover:bg-neutral-800">
          <div class="size-5"><MenuIcon /></div>
        </button>
        <router-link to="/" class="px-2"> YouDroppedThis </router-link>
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
          class="bg-black rounded-lg border border-neutral-600 lg:w-52 w-full h-fit sticky top-10"
        >
          <div class="">
            <ul class="flex lg:flex-col text-nowrap gap-2 p-2 overflow-x-auto">
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
        </nav>

        <div class="rounded-lg border border-neutral-600 p-6 flex-1" v-if="authStore.user">
          <GeneralSettingsView v-if="route.params.tab === 'general'" />
          <AccountSettingsView v-else-if="route.params.tab === 'account'" />
          <TransactionsTable
            v-else-if="route.params.tab === 'transactions'"
            :user-id="authStore.user.id"
          />
          <PurchaseView v-else-if="route.params.tab === 'purchase'" />
        </div>
      </div>
    </div>
  </div>
  <Drawer ref="drawer" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import GeneralSettingsView from './GeneralSettingsView.vue'
import AccountSettingsView from './AccountSettingsView.vue'
import TransactionsTable from './TransactionsTable.vue'
import PurchaseView from './PurchaseView.vue'
import MenuIcon from '@/assets/icons/menu.svg'
import ProfileButton from '../ProfileButton.vue'
import Drawer from '@/components/Layout/Drawer.vue'
import { useTemplateRef } from 'vue'
import { useAuthStore } from '@/stores/auth'

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')
const route = useRoute()
const authStore = useAuthStore()
</script>
