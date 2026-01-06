<template>
  <template v-if="authStore.isAuthenticated && authStore.user">
    <div class="relative">
      <button class="peer cursor-pointer text-xl">
        <ProfilePicture :profile="authStore.user" />
      </button>
      <div
        class="peer-focus:block hidden active:block focus:block absolute right-0 top-full bg-black rounded-lg w-fit shadow-md border border-neutral-600 mt-1"
        tabindex="0"
      >
        <div class="flex gap-3 items-center p-3 border-b border-neutral-600">
          <span class="text-2xl"><ProfilePicture :profile="authStore.user" /></span>
          <div>
            <div class="h-4">{{ authStore.user.username }}</div>
            <span class="text-xs text-neutral-400">{{ authStore.user.email }}</span>
          </div>
        </div>
        <div
          v-if="emailConfirmRequired"
          class="flex gap-3 items-center text-left text-code-warn bg-code-warn-bg p-3 font-medium text-xs w-full"
        >
          Please check your email to confirm your account
        </div>
        <router-link
          v-else
          to="/settings/general"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          <span class="size-5"><SettingsIcon /></span>
          Settings
        </router-link>
        <button
          @click="authStore.logout"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          <span class="size-5"><LogoutIcon /></span>
          Sign out
        </button>
      </div>
      <div
        v-if="emailConfirmRequired"
        class="absolute -top-1 -left-1 rounded-full bg-code-warn size-3"
      />
    </div>
  </template>
  <template v-else>
    <button
      @click="openAuthModal('login')"
      class="text-primary border-2 border-current cursor-pointer font-semibold p-3 py-1.5 rounded-md bg-black/50 backdrop-blur-xl"
    >
      Sign in
    </button>
    <AuthModal :is-open="showAuthModal" :initial-mode="authModalMode" @close="closeAuthModal" />
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/User/Auth.vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import LogoutIcon from '@/assets/icons/logout.svg'
import ProfilePicture from './ProfilePicture.vue'

const authStore = useAuthStore()

const showAuthModal = ref(false)
const authModalMode = ref<'login' | 'register'>('login')

function openAuthModal(mode: 'login' | 'register') {
  authModalMode.value = mode
  showAuthModal.value = true
}

function closeAuthModal() {
  showAuthModal.value = false
}

const emailConfirmRequired = computed(() => !authStore.user?.confirmed_at)
</script>
