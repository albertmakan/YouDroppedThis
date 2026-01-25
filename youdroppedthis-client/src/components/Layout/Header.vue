<template>
  <header class="flex justify-between items-start sticky top-0 z-10 bg-neutral-950">
    <div class="flex items-center text-primary font-bold">
      <button @click="emit('openDrawer')" class="p-2 cursor-pointer hover:bg-neutral-800">
        <div class="size-5"><MenuIcon /></div>
      </button>
      <router-link to="/" class="px-2"> YouDroppedThis </router-link>
    </div>
    <div class="p-2 pb-0 z-10">
      <ProfileButton />
    </div>
  </header>
</template>

<script setup lang="ts">
import ProfileButton from '../User/ProfileButton.vue'
import MenuIcon from '@/assets/icons/menu.svg'

const emit = defineEmits<{ openDrawer: [] }>()
</script>
