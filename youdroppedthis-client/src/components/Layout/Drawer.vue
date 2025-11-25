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
    <div class="overflow-y-auto overflow-x-hidden h-[calc(100vh-40px)]">
      <nav class="p-4 pt-0 space-y-2">
        <div v-if="canvasInfo" class="rounded-md bg-neutral-900">
          <h3 class="text-sm font-semibold text-amber-500 tracking-wide px-3 pt-2 mb-2">
            {{ canvasInfo?.name }}
          </h3>
          <button
            @click="showInfo = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><StatsIcon /></span>
            Canvas info
          </button>
          <button
            @click="isLocationPopupOpen = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><LocationIcon /></span>
            To location
          </button>
        </div>
        <div v-else-if="isError" class="rounded-md bg-code-error/20">
          <h3 class="text-sm font-semibold text-code-error tracking-wide px-3 py-2">
            Error getting canvas /{{ canvasId }}:
            {{ Object.values((canvasError as AxiosError)?.response?.data as any).join() }}
          </h3>
        </div>
        <div class="mt-6">
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
        <div class="mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Economy
          </h3>
          <router-link
            to="/settings/purchase"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><CoinsIcon /></span>
            Buy coins
            <span class="text-xs text-code-warn bg-code-warn-bg px-2 py-1 rounded-full ml-auto">
              FREE
            </span>
          </router-link>
          <DailyBonus v-if="authStore.isAuthenticated" />
          <div
            v-if="authStore.isAuthenticated"
            class="mt-2 px-3 py-2 bg-neutral-900 rounded text-sm"
          >
            <div class="text-xs">Balance:</div>
            <div class="text-lg font-bold text-primary">{{ authStore.user?.balance || 0 }}</div>
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Community
          </h3>
          <button
            @click="showAbout = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><InfoIcon /></span>
            About
          </button>
          <a
            href="#https://discord.com/invite/youdroppedthis"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><MessageIcon /></span>
            Discord community
          </a>
        </div>
        <div class="mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Top canvases
          </h3>
          <router-link
            v-for="canvasLink in topCanvases"
            :to="`/c/${canvasLink.id}`"
            class="flex gap-3 items-center text-left px-3 py-1 rounded-lg hover:bg-neutral-800 text-sm"
            :key="canvasLink.id"
          >
            <div
              class="rounded-full size-4"
              :style="{ background: canvasLink.background_color || CANVAS_BACKGROUND }"
            />
            <span :class="{ 'font-semibold': canvasLink.id === canvasId }">
              {{ canvasLink.name }}
            </span>
          </router-link>
        </div>
      </nav>
    </div>
  </div>

  <div v-if="isOpen" class="fixed inset-0 bg-black opacity-30 z-30" @click="closeDrawer" />

  <SelectLocationPopup
    v-if="isLocationPopupOpen"
    @close="isLocationPopupOpen = false"
    :min-x="canvasInfo?.min_x"
    :max-x="canvasInfo?.max_x"
    :min-y="canvasInfo?.min_y"
    :max-y="canvasInfo?.max_y"
  />
  <CanvasInfoPopup v-if="showInfo && canvasInfo" @close="showInfo = false" :canvas="canvasInfo" />
  <InfoPopup v-if="showAbout" title="About" @close="showAbout = false">
    <p>YouDroppedThis - Drop Art, Find Treasures</p>
    <p>Create pixel art and drop it on a shared canvas.</p>
    <p>Other users can discover and collect your work before it expires in 24 hours.</p>
    <p>🎨 Create • 🗺️ Explore • 🎯 Collect • ✨ Discover</p>
    <p>Join our community and be part of the world's most dynamic collaborative art canvas!</p>
  </InfoPopup>
  <UserCollection
    v-if="showCollection && authStore.user"
    @close="showCollection = false"
    :user-id="authStore.user.id"
  />
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MenuIcon from '../Icons/MenuIcon.vue'
import StatsIcon from '../Icons/StatsIcon.vue'
import LocationIcon from '../Icons/LocationIcon.vue'
import CollectionIcon from '../Icons/CollectionIcon.vue'
import CoinsIcon from '../Icons/CoinsIcon.vue'
import InfoIcon from '../Icons/InfoIcon.vue'
import MessageIcon from '../Icons/MessageIcon.vue'
import SelectLocationPopup from '../Canvas/SelectLocationPopup.vue'
import CanvasInfoPopup from '../Canvas/CanvasInfoPopup.vue'
import InfoPopup from './InfoPopup.vue'
import DailyBonus from '../User/DailyBonusButton.vue'
import UserCollection from '../User/UserCollection.vue'
import { useCanvas, useTopCanvases } from '@/composables/useCanvases'
import { CANVAS_BACKGROUND } from '@/stores/canvas'
import type { AxiosError } from 'axios'

const props = defineProps<{ canvasId?: number }>()

const authStore = useAuthStore()
const { data: canvasInfo, isError, error: canvasError } = useCanvas(toRef(props, 'canvasId'))
const { data: topCanvases } = useTopCanvases()

const isOpen = ref(false)
const showInfo = ref(false)
const showAbout = ref(false)
const showCollection = ref(false)
const isLocationPopupOpen = ref(false)

function openDrawer() {
  isOpen.value = true
}

function closeDrawer() {
  isOpen.value = false
}

watch(
  () => props.canvasId,
  () => (showInfo.value = true),
  { immediate: true },
)

defineExpose({ openDrawer, closeDrawer })
</script>
