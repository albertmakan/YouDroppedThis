<template>
  <template v-if="authStore.isAuthenticated">
    <div class="relative">
      <button class="peer rounded-full bg-green-800 size-8 text-2xl text-white cursor-pointer">
        {{ authStore.user?.username.charAt(0) }}
      </button>
      <div
        class="peer-focus:block hidden active:block absolute right-0 top-full bg-neutral-800 rounded-md w-32 shadow-md"
      >
        <button
          @click="showUserProfile = true"
          class="p-2 cursor-pointer flex w-full text-neutral-200 text-right rounded-md hover:bg-neutral-700"
        >
          Profile
        </button>
        <button
          @click="authStore.logout"
          class="text-red-600 p-2 cursor-pointer flex w-full text-right rounded-md hover:bg-neutral-700"
        >
          Logout
        </button>
      </div>
    </div>
    <UserProfile v-if="showUserProfile" @close="closeUserProfile" />
  </template>
  <template v-else>
    <button
      @click="openAuthModal('login')"
      class="text-blue-600 hover:text-blue-800 transition-colors"
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
import { onMounted, ref } from 'vue'
import UserProfile from '@/components/User/UserProfile.vue'

const authStore = useAuthStore()

const showAuthModal = ref(false)
const authModalMode = ref<'login' | 'register'>('login')
const showUserProfile = ref(false)

onMounted(async () => {
  // Try to load user if token exists
  await authStore.loadUser()

  // Start WebSocket connection if authenticated
  if (authStore.isAuthenticated) {
    // canvasStore.startWebSocketConnection()
  }
})

function logout() {
  authStore.logout()
  // canvasStore.stopWebSocketConnection()
  // router.push('/login')
}
function openAuthModal(mode: 'login' | 'register') {
  authModalMode.value = mode
  showAuthModal.value = true
}

function closeAuthModal() {
  showAuthModal.value = false
}

function closeUserProfile() {
  showUserProfile.value = false
}

function handleAuthSuccess() {
  console.log('Authentication successful!')
  // Could show a success toast here
}
</script>
