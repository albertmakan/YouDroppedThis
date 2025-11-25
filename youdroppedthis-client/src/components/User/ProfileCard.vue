<template>
  <span class="inline-flex gap-[0.5em] items-center">
    <ProfilePicture :profile />
    <span v-if="profileLoading" class="bg-neutral-700 animate-pulse rounded-md w-[8em] h-[1em]" />
    <span v-else class="">{{ profile?.username }}</span>
  </span>
</template>

<script setup lang="ts">
import { useProfile } from '@/composables/useProfiles'
import ProfilePicture from './ProfilePicture.vue'
import { toRef } from 'vue'

const props = defineProps<{ userId: string }>()

const { data: profile, isLoading: profileLoading } = useProfile(toRef(props, 'userId'))
</script>
