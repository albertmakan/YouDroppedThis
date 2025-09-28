<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center z-50 bg-black/50" @click="closeModal">
    <div
      class="bg-neutral-800 text-neutral-200 rounded-lg shadow-lg m-4 sm:m-auto p-4 w-full sm:w-96"
      @click.stop
    >
      <div class="flex w-full justify-between text-2xl">
        <h2>{{ mode === 'login' ? 'Welcome Back!' : 'Join YouDroppedThis' }}</h2>

        <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>
      <div class="flex mt-4 w-full">
        <button
          @click="setMode('login')"
          :class="[
            'flex-1 border-b-2 p-3 cursor-pointer transition-all font-semibold',
            {
              'text-teal-600 border-current': mode === 'login',
              'border-transparent': mode !== 'login',
            },
          ]"
        >
          Login
        </button>
        <button
          @click="setMode('register')"
          :class="[
            'flex-1 border-b-2 p-3 cursor-pointer transition-all font-semibold',
            {
              'text-teal-600 border-current': mode === 'register',
              'border-transparent': mode !== 'register',
            },
          ]"
        >
          Register
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-4">
        <div v-if="authStore.error" class="p-3 bg-red-950 rounded-lg text-red-300">
          {{ authStore.error }}
        </div>

        <!-- Registration fields -->
        <template v-if="mode === 'register'">
          <label for="email" class="mt-4 mb-1 block text-sm">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="your@email.com"
            :disabled="authStore.isLoading"
            class="w-full p-3 border rounded-lg focus:border-teal-400 outline-0"
          />
        </template>
        <!-- Common fields -->
        <label for="username" class="mt-4 mb-1 block text-sm">Username</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          placeholder="Enter username"
          :disabled="authStore.isLoading"
          class="w-full p-3 border rounded-lg focus:border-teal-400 outline-0"
        />

        <label for="password" class="mt-4 mb-1 block text-sm">Password</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          :placeholder="mode === 'register' ? 'At least 6 characters' : 'Enter password'"
          :disabled="authStore.isLoading"
          class="w-full p-3 border rounded-lg focus:border-teal-400 outline-0"
        />

        <button
          type="submit"
          class="w-full mt-6 p-3 bg-teal-600 rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-700 inline-flex gap-2 items-center justify-center"
          :disabled="authStore.isLoading || !isFormValid"
        >
          <div
            v-if="authStore.isLoading"
            class="size-4 animate-spin rounded-full border-2 border-t-transparent"
          />
          {{
            authStore.isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'
          }}
        </button>
      </form>

      <p
        v-if="mode === 'register'"
        class="rounded-lg bg-teal-950 p-3 italic text-sm text-center text-teal-200"
      >
        🎨 You'll start with <strong>100 coins</strong> to place your first artworks!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import XMarkIcon from '../Icons/XMarkIcon.vue'

// Props
interface Props {
  isOpen: boolean
  initialMode?: 'login' | 'register'
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login',
})

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Auth composable
const authStore = useAuthStore()

// Component state
const mode = ref<'login' | 'register'>(props.initialMode)
const formData = ref({
  username: '',
  email: '',
  password: '',
})

// Computed
const isFormValid = computed(() => {
  if (mode.value === 'register') {
    return (
      formData.value.username.length > 0 &&
      formData.value.email.length > 0 &&
      formData.value.password.length >= 6
    )
  } else {
    return formData.value.username.length > 0 && formData.value.password.length > 0
  }
})

// Methods
function setMode(newMode: 'login' | 'register') {
  mode.value = newMode
  authStore.clearError()
  formData.value = { username: '', email: '', password: '' }
}

function closeModal() {
  emit('close')
  authStore.clearError()
  formData.value = { username: '', email: '', password: '' }
}

async function handleSubmit() {
  if (!isFormValid.value) return

  authStore.clearError()

  let success = false

  if (mode.value === 'register') {
    success = await authStore.register(
      formData.value.username,
      formData.value.email,
      formData.value.password,
    )
  } else {
    success = await authStore.login(formData.value.username, formData.value.password)
  }

  if (success) {
    emit('success')
    closeModal()
  }
}

// Watch for modal open/close to reset form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      mode.value = props.initialMode
      formData.value = { username: '', email: '', password: '' }
      authStore.clearError()
    }
  },
)
</script>
