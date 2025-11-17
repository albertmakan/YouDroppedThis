<template>
  <span class="inline-flex gap-[0.5em] items-center">
    <ProfilePicture :profile />
    <span v-if="profileLoading" class="bg-neutral-700 animate-pulse rounded-md w-[8em] h-[1em]" />
    <span v-else class="">{{ profile?.username }}</span>
  </span>
</template>

<script setup lang="ts">
import { useProfile } from '@/stores/profiles'
import ProfilePicture from './ProfilePicture.vue'

const { userId } = defineProps<{ userId: string }>()

const { profile, isLoading: profileLoading } = useProfile(userId)
</script>
