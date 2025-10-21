<template>
  <div
    class="fixed left-0 top-0 h-screen w-60 bg-black text-neutral-300 shadow-lg z-40 transform transition-transform duration-300 border-neutral-600 border-r"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex gap-2 items-center text-primary p-2 z-10 font-bold">
      <button @click="isOpen = false" class="size-5 cursor-pointer hover:bg-neutral-800">
        <MenuIcon />
      </button>
      YouDroppedThis
    </div>
    <div class="overflow-y-auto h-[calc(100vh-40px)]">
      <nav class="p-4 space-y-2">
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Canvas
          </h3>
          <button
            @click="showStats = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><StatsIcon /></span>
            Canvas stats
          </button>
          <button
            @click="isLocationPopupOpen = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><LocationIcon /></span>
            To location
          </button>
        </div>
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Collection
          </h3>
          <button
            v-if="authStore.isAuthenticated"
            @click="showCollection = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><CollectionIcon /></span>
            My collection
          </button>
        </div>
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Economy
          </h3>
          <router-link
            to="/shop"
            @click="closeDrawer"
            class="flex justify-between text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="flex gap-3 items-center">
              <span class="size-5"><CoinsIcon /></span>
              Buy coins
            </span>
            <span class="text-xs text-amber-200 bg-amber-600/30 px-2 py-1 rounded"> FREE </span>
          </router-link>
          <DailyBonus v-if="authStore.isAuthenticated" />
          <div
            v-if="authStore.isAuthenticated"
            class="mx-3 mt-2 p-2 bg-neutral-900 rounded text-sm"
          >
            <div class="">Balance:</div>
            <div class="text-lg font-bold text-primary">{{ authStore.user?.balance || 0 }}</div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Community
          </h3>
          <button
            @click="showAbout = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><InfoIcon /></span>
            About YouDroppedThis
          </button>
          <a
            href="#https://discord.com/invite/youdroppedthis"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><MessageIcon /></span>
            Discord community
          </a>
        </div>
      </nav>
    </div>
  </div>

  <div v-if="isOpen" class="fixed inset-0 bg-black opacity-30 z-30" @click="closeDrawer" />

  <SelectLocationPopup v-if="isLocationPopupOpen" @close="isLocationPopupOpen = false" />
  <CanvasStatsPopup v-if="showStats" @close="showStats = false" />
  <InfoPopup v-if="showAbout" title="About" @close="showAbout = false">
    <p>YouDroppedThis - Drop Art, Find Treasures</p>
    <p>Create pixel art and drop it on a shared canvas.</p>
    <p>Other users can discover and collect your work before it expires in 24 hours.</p>
    <p>🎨 Create • 🗺️ Explore • 🎯 Collect • ✨ Discover</p>
    <p>Join our community and be part of the world's most dynamic collaborative art canvas!</p>
  </InfoPopup>
  <UserCollection v-if="showCollection" @close="showCollection = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MenuIcon from '../Icons/MenuIcon.vue'
import StatsIcon from '../Icons/StatsIcon.vue'
import LocationIcon from '../Icons/LocationIcon.vue'
import CollectionIcon from '../Icons/CollectionIcon.vue'
import CoinsIcon from '../Icons/CoinsIcon.vue'
import InfoIcon from '../Icons/InfoIcon.vue'
import MessageIcon from '../Icons/MessageIcon.vue'
import SelectLocationPopup from '../Canvas/SelectLocationPopup.vue'
import CanvasStatsPopup from '../Canvas/CanvasStatsPopup.vue'
import InfoPopup from './InfoPopup.vue'
import DailyBonus from '../Shop/DailyBonusButton.vue'
import UserCollection from '../User/UserCollection.vue'

const authStore = useAuthStore()

const isOpen = ref(false)
const showStats = ref(false)
const showAbout = ref(false)
const showCollection = ref(false)
const isLocationPopupOpen = ref(false)

function openDrawer() {
  isOpen.value = true
}

function closeDrawer() {
  isOpen.value = false
}

defineExpose({ openDrawer, closeDrawer })
</script>
