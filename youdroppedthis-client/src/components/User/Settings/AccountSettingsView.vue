<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Account Settings</h2>
    <p class="text-neutral-400 mb-6">Manage your account security</p>
  </div>

  <form class="space-y-4" @submit.prevent="changePassword">
    <div>
      <label class="block text-sm font-medium mb-2">Email</label>
      <input
        :value="authStore.user?.email"
        type="email"
        class="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        placeholder="your@email.com"
        disabled
        autocomplete="email"
      />
    </div>

    <div class="border-t border-neutral-600 pt-6">
      <h3 class="text-lg font-semibold mb-4">Change Password</h3>

      <div class="space-y-4">
        <div>
          <label for="current-password" class="block text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            v-model="passwords.current"
            type="password"
            id="current-password"
            autocomplete="current-password"
            class="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label for="new-password" class="block text-sm font-medium mb-2"> New Password </label>
          <input
            v-model="passwords.new"
            type="password"
            id="new-password"
            autocomplete="new-password"
            class="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          />
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <input
            v-model="passwords.confirm"
            type="password"
            id="confirm-password"
            autocomplete="new-password"
            class="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          />
        </div>

        <button
          :disabled="!canUpdate"
          class="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update Password
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { authApi } from '@/services/api'

const toast = useToast()

const authStore = useAuthStore()

const passwords = ref({
  current: '',
  new: '',
  confirm: '',
})

//todo validate
const canUpdate = computed(() => {
  return (
    passwords.value.current &&
    passwords.value.new.length > 6 &&
    passwords.value.new === passwords.value.confirm
  )
})

async function changePassword() {
  if (!authStore.user) return
  const { error } = await authApi.signIn(authStore.user.email, passwords.value.current)
  if (error) {
    toast.error('Incorrect password!')
    passwords.value.current = ''
  } else {
    const { error: updateError } = await authApi.updatePassword(passwords.value.new)
    if (updateError) {
      toast.error('Password update failed')
    } else {
      toast.success('Password updated')
      passwords.value = { current: '', new: '', confirm: '' }
    }
  }
}
</script>
