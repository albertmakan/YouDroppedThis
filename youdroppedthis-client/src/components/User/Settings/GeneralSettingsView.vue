<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">General Settings</h2>
    <p class="text-neutral-400 mb-6">Update your profile information</p>
  </div>

  <div v-if="authStore.user" class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-2">Bio</label>
      <textarea
        v-model="profile.bio"
        rows="4"
        class="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
        placeholder="Tell us about yourself..."
      />
    </div>
    <div class="pt-4">
      <button
        @click="saveGeneral"
        v-if="changed"
        class="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors cursor-pointer"
      >
        Save changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { userApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { computed, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const authStore = useAuthStore()

const profile = ref({
  bio: authStore.user?.bio,
})

const changed = computed(() => {
  return profile.value.bio !== authStore.user?.bio
})

async function saveGeneral() {
  const updated = await userApi.updateProfile({ bio: profile.value.bio })
  authStore.setProfileInfo(updated.profile)
  toast.success('Settings saved!')
}

watch(
  () => authStore.user,
  () => {
    profile.value.bio = authStore.user?.bio
  },
  { deep: true },
)
</script>
