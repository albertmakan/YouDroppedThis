<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center z-50 bg-black/50" @click="closeModal">
    <div
      class="bg-black text-neutral-200 border border-neutral-600 rounded-lg shadow-lg m-4 sm:m-auto p-4 w-full sm:w-96"
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
              'text-primary border-current': mode === 'login',
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
              'text-primary border-current': mode === 'register',
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
          <label for="username" class="mt-4 mb-1 block text-sm">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            minlength="3"
            maxlength="20"
            pattern="^[a-zA-Z0-9_]+$"
            placeholder="Enter username"
            :disabled="authStore.isLoading"
            autocomplete="username"
            class="w-full p-3 border rounded-lg focus:border-primary outline-0"
          />
          <span class="text-xs text-neutral-400">{{
            (formData.username &&
              ((!/^[a-zA-Z0-9_-]+$/.test(formData.username) && 'Only letters, numbers and _') ||
                (formData.username.length < 3 && 'At least 3 characters') ||
                (formData.username.length > 20 && 'Max 20 characters'))) ||
            ''
          }}</span>
        </template>
        <!-- Common fields -->
        <label for="email" class="mt-4 mb-1 block text-sm">Email</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          placeholder="your@email.com"
          :disabled="authStore.isLoading"
          autocomplete="email"
          class="w-full p-3 border rounded-lg focus:border-primary outline-0"
        />
        <label for="password" class="mt-4 mb-1 block text-sm">Password</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          minlength="6"
          :placeholder="mode === 'register' ? 'At least 6 characters' : 'Enter password'"
          :disabled="authStore.isLoading"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          class="w-full p-3 border rounded-lg focus:border-primary outline-0"
        />
        <span v-if="mode === 'register'" class="text-xs text-neutral-400">{{
          (formData.password && formData.password.length < 6 && 'At least 6 characters') || ''
        }}</span>
        <button
          type="submit"
          class="w-full mt-6 p-3 bg-primary rounded-lg font-semibold cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-700 inline-flex gap-2 items-center justify-center"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import XMarkIcon from '@/assets/icons/xmark.svg'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    initialMode?: 'login' | 'register'
  }>(),
  {
    initialMode: 'login',
  },
)

const emit = defineEmits<{
  close: []
  success: []
}>()

const authStore = useAuthStore()

const mode = ref<'login' | 'register'>(props.initialMode)
const formData = ref({
  username: '',
  email: '',
  password: '',
})

const isFormValid = computed(() => {
  if (mode.value === 'register') {
    return (
      formData.value.username.length > 0 &&
      formData.value.email.length > 0 &&
      formData.value.password.length >= 6
    )
  }
  return formData.value.email.length > 0 && formData.value.password.length > 0
})

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
    success = await authStore.login(formData.value.email, formData.value.password)
  }

  if (success) {
    emit('success')
    closeModal()
  }
}

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
