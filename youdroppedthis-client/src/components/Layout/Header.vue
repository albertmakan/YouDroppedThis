<template>
  <header class="flex justify-between items-start sticky top-0 z-10 bg-neutral-950">
    <div class="flex items-center font-bold">
      <button @click="emit('openDrawer')" class="p-2 cursor-pointer hover:bg-neutral-800">
        <div class="size-5"><MenuIcon /></div>
      </button>
      <router-link to="/" class="px-2 text-primary"> YouDroppedThis </router-link>
    </div>
    <div class="p-2 pb-0 z-10 flex gap-4 items-center">
      <router-link
        v-if="showHostOption"
        to="/new"
        class="inline-flex gap-3 items-center px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-fit cursor-pointer"
      >
        <span class="size-5 shrink-0"><PlusIcon /></span>
        <span class="sm:inline hidden">Host</span>
      </router-link>
      <ProfileButton />
    </div>
  </header>
</template>

<script setup lang="ts">
import ProfileButton from '@/components/User/ProfileButton.vue'
import MenuIcon from '@/assets/icons/menu.svg'
import PlusIcon from '@/assets/icons/plus.svg'

defineProps<{ showHostOption?: boolean }>()
const emit = defineEmits<{ openDrawer: [] }>()
</script>
