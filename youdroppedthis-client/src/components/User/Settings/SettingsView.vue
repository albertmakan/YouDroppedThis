<template>
  <Header @open-drawer="drawerRef?.openDrawer" />
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Profile Settings</h1>
      <p class="text-neutral-400">Manage your account and preferences</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-4">
      <nav class="bg-black rounded-lg border border-neutral-600 lg:w-52 w-full h-fit sticky top-10">
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
      </div>
    </div>
  </div>
  <Drawer ref="drawer" />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GeneralSettingsView from './GeneralSettingsView.vue'
import AccountSettingsView from './AccountSettingsView.vue'
import TransactionsTable from './TransactionsTable.vue'
import Drawer from '@/components/Layout/Drawer.vue'
import Header from '@/components/Layout/Header.vue'

const drawerRef = useTemplateRef<InstanceType<typeof Drawer>>('drawer')
const route = useRoute()
const authStore = useAuthStore()
</script>
