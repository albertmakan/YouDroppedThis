<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">General Settings</h2>
    <p class="text-neutral-400 mb-6">Update your profile information</p>
  </div>

  <form v-if="authStore.user" class="space-y-4" @submit.prevent="saveGeneral">
    <div>
      <label for="avatar" class="text-sm font-medium mb-2">
        Avatar
        <div
          class="inline-block rounded-full size-[1.4em] aspect-square text-white text-center text-2xl"
          :style="{ background: profile.avatarColor }"
        >
          {{ authStore.user.username.charAt(0) }}
        </div>
      </label>
      <input type="color" id="avatar" v-model="profile.avatarColor" class="size-0" />
    </div>
    <div>
      <label for="bio" class="text-sm font-medium mb-2">Bio</label>
      <textarea
        id="bio"
        v-model="profile.bio"
        rows="4"
        class="block w-full bg-neutral-900 border border-neutral-600 rounded-lg px-4 py-2 my-1 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        placeholder="Tell us about yourself..."
        :maxlength="2000"
      />
      <div v-if="changed" class="text-neutral-400 text-xs text-right">
        {{ profile.bio?.length }}/2000
      </div>
    </div>
    <div>
      <button
        v-if="changed"
        class="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors cursor-pointer"
      >
        Save changes
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useUpdateProfile } from '@/composables/useProfiles'
import type { AxiosError } from 'axios'

const { mutate: mutateUpdateProfile } = useUpdateProfile()

const toast = useToast()

const authStore = useAuthStore()

const profile = ref({
  bio: authStore.user?.bio,
  avatarColor: authStore.user?.profile_picture?.palette[0],
})

const changed = computed(() => {
  return (
    profile.value.bio !== authStore.user?.bio ||
    profile.value.avatarColor !== authStore.user?.profile_picture?.palette[0]
  )
})

async function saveGeneral() {
  mutateUpdateProfile(
    {
      bio: profile.value.bio,
      profilePicture: profile.value.avatarColor
        ? { palette: [profile.value.avatarColor], mat: [[]] }
        : undefined,
    },
    {
      onSuccess: (updated) => {
        authStore.setProfileInfo(updated.profile)
        toast.success('Profile info saved!')
      },
      onError: (error) => {
        toast.error(
          'Failed to update profile: ' +
            JSON.stringify((error as AxiosError).response?.data, null, 4),
        )
      },
    },
  )
}

watch(
  () => authStore.user,
  () => {
    profile.value.bio = authStore.user?.bio
    profile.value.avatarColor = authStore.user?.profile_picture?.palette[0]
  },
  { deep: true },
)
</script>
