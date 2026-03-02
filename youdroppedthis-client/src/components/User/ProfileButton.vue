<template>
  <template v-if="authStore.isAuthenticated && authStore.user">
    <div class="relative">
      <button class="peer cursor-pointer text-xl">
        <ProfilePicture :profile="authStore.user" />
      </button>
      <div
        class="peer-focus:block hidden active:block focus:block focus-within:block absolute right-0 top-full bg-black rounded-lg w-fit shadow-md border border-neutral-600 mt-1"
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
  <template v-else-if="canvasId != null">
    <div class="relative">
      <button class="peer cursor-pointer text-primary border-2 border-current font-semibold p-3 py-1.5 rounded-md bg-black/50 backdrop-blur-xl text-left min-w-0 truncate max-w-[10rem]">
        {{ guestIdentity?.guestName ?? 'Guest' }}
      </button>
      <div
        class="peer-focus:block hidden active:block focus:block focus-within:block absolute right-0 top-full bg-black rounded-lg w-fit min-w-[12rem] shadow-md border border-neutral-600 mt-1 z-10"
        tabindex="0"
      >
        <div class="p-3 border-b border-neutral-600">
          <label class="text-xs text-neutral-400 block mb-1">Display name</label>
          <input
            v-model="guestNameInput"
            type="text"
            placeholder="Guest name"
            class="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            @keydown.enter.prevent="applyGuestName"
          />
          <button
            @click="applyGuestName"
            class="mt-2 w-full text-center text-sm py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors"
          >
            Update name
          </button>
        </div>
        <button
          @click="openAuthModal('login')"
          class="flex gap-3 items-center text-left p-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
    <AuthModal :is-open="showAuthModal" :initial-mode="authModalMode" @close="closeAuthModal" />
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
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/User/Auth.vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import LogoutIcon from '@/assets/icons/logout.svg'
import ProfilePicture from './ProfilePicture.vue'

const props = defineProps<{
  canvasId?: number | null
}>()

const authStore = useAuthStore()

const guestIdentity = computed(() =>
  props.canvasId != null ? authStore.getGuestIdentity(props.canvasId) : null,
)

const guestNameInput = ref('')
watch(
  () => guestIdentity.value?.guestName,
  (name) => {
    if (name) guestNameInput.value = name
  },
  { immediate: true }
)

function applyGuestName() {
  const name = guestNameInput.value.trim()
  if (name && props.canvasId != null) {
    authStore.setGuestName(props.canvasId, name)
  }
}

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
