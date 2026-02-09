<template>
  <div
    class="fixed left-0 top-0 h-screen w-60 bg-black text-neutral-300 shadow-lg z-40 transform transition-transform duration-300 border-neutral-600 border-r"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center z-10 font-bold">
      <button @click="isOpen = false" class="p-2 cursor-pointer hover:bg-neutral-800">
        <div class="size-5"><MenuIcon /></div>
      </button>
      <router-link to="/now" class="px-2 text-primary">YouDroppedThis</router-link>
    </div>
    <div class="overflow-y-auto overflow-x-hidden h-[calc(100vh-40px)]">
      <nav class="p-4 space-y-2">
        <div v-if="canvasInfo" class="rounded-md bg-neutral-900">
          <h3 class="text-sm font-semibold text-neutral-200 tracking-wide px-3 pt-2 mb-2">
            {{ canvasInfo.canvas?.name }}
          </h3>
          <button
            @click="showInfo = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><InfoIcon /></span>
            About this moment
          </button>
          <button
            @click="isLocationPopupOpen = true"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5"><LocationIcon /></span>
            Center view
          </button>
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
            <span class="size-5"><CollectIcon /></span>
            Collected pieces
          </button>
        </div>
        <div class="mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Participation
          </h3>
          <DailyBonus v-if="authStore.isAuthenticated" />
          <div
            v-if="authStore.isAuthenticated"
            class="mt-2 px-3 py-2 bg-neutral-900 rounded text-sm"
          >
            <div class="text-xs">Balance:</div>
            <div class="text-lg font-bold text-primary">
              {{ authStore.user?.balance || 0 }} coins
            </div>
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Create
          </h3>
          <router-link
            to="/new"
            class="flex gap-3 items-center text-left px-3 py-3 rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm w-full cursor-pointer"
          >
            <span class="size-5 shrink-0"><PlusIcon /></span>
            Host a moment
          </router-link>
        </div>
        <div class="mt-6 space-y-1">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
            Hosted
          </h3>
          <CanvasesList
            v-if="authStore.user"
            :user-id="authStore.user.id"
            :active-canvas-id="canvasId"
          />
        </div>
      </nav>
    </div>
  </div>

  <div v-if="isOpen" class="fixed inset-0 bg-black opacity-30 z-30" @click="closeDrawer" />

  <SelectLocationPopup
    v-if="isLocationPopupOpen"
    @close="isLocationPopupOpen = false"
    :min-x="canvasInfo?.canvas.min_x"
    :max-x="canvasInfo?.canvas.max_x"
    :min-y="canvasInfo?.canvas.min_y"
    :max-y="canvasInfo?.canvas.max_y"
  />
  <CanvasInfoPopup
    v-if="showInfo && canvasInfo"
    @close="showInfo = false"
    :canvas="canvasInfo.canvas"
  />
  <UserCollection
    v-if="showCollection && authStore.user"
    @close="showCollection = false"
    :user-id="authStore.user.id"
  />
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCanvas } from '@/composables/useCanvases'
import MenuIcon from '@/assets/icons/menu.svg'
import InfoIcon from '@/assets/icons/info.svg'
import LocationIcon from '@/assets/icons/location.svg'
import CollectIcon from '@/assets/icons/collect.svg'
import PlusIcon from '@/assets/icons/plus.svg'
import SelectLocationPopup from '@/components/Canvas/SelectLocationPopup.vue'
import CanvasInfoPopup from '@/components/Canvas/CanvasInfoPopup.vue'
import DailyBonus from '@/components/User/DailyBonusButton.vue'
import UserCollection from '@/components/User/UserCollection.vue'
import CanvasesList from '@/components/User/CanvasesList.vue'

const props = defineProps<{ canvasId?: number }>()

const authStore = useAuthStore()
const { data: canvasInfo } = useCanvas(toRef(props, 'canvasId'))

const isOpen = ref(false)
const showInfo = ref(false)
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
