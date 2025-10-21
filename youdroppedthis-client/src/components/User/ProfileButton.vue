<template>
  <template v-if="authStore.isAuthenticated && authStore.user">
    <div class="relative">
      <button class="peer rounded-full bg-teal-800 size-8 text-2xl text-white cursor-pointer">
        {{ authStore.user.username.charAt(0) }}
      </button>
      <div
        class="peer-focus:block hidden active:block focus:block absolute right-0 top-full bg-black rounded-lg w-fit text-neutral-200 shadow-md border border-neutral-600 mt-1"
        tabindex="0"
      >
        <div class="flex gap-3 items-center p-3 border-b border-neutral-600">
          <div class="rounded-full bg-teal-800 size-8 text-white text-center text-2xl">
            {{ authStore.user.username?.charAt(0) }}
          </div>
          <div>
            <div class="h-4">{{ authStore.user.username }}</div>
            <span class="text-xs text-neutral-400">{{ authStore.user.email }}</span>
          </div>
        </div>
        <button
          @click="showUserProfile = true"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          <span class="size-5"><ProfileIcon /></span>
          Profile
        </button>
        <button
          @click="showUserProfile = true"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          <span class="size-5"><SettingsIcon /></span>
          Settings
        </button>
        <button
          @click="authStore.logout"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          <span class="size-5"><LogoutIcon /></span>
          Sign out
        </button>
      </div>
    </div>
  </template>
  <template v-else>
    <button
      @click="openAuthModal('login')"
      class="text-primary border-2 border-current cursor-pointer font-semibold p-3 py-1.5 rounded-md bg-black/50 backdrop-blur-xl"
    >
      Sign in
    </button>
    <AuthModal
      :is-open="showAuthModal"
      :initial-mode="authModalMode"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
    />
  </template>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/User/Auth.vue'
import { ref } from 'vue'
import ProfileIcon from '../Icons/ProfileIcon.vue'
import SettingsIcon from '../Icons/SettingsIcon.vue'
import LogoutIcon from '../Icons/LogoutIcon.vue'

const authStore = useAuthStore()

const showAuthModal = ref(false)
const authModalMode = ref<'login' | 'register'>('login')
const showUserProfile = ref(false)

function openAuthModal(mode: 'login' | 'register') {
  authModalMode.value = mode
  showAuthModal.value = true
}

function closeAuthModal() {
  showAuthModal.value = false
}

function handleAuthSuccess() {
  console.log('Authentication successful!')
  // Could show a success toast here
}
</script>
