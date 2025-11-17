<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div
      class="bg-black text-neutral-200 rounded-lg shadow-lg mx-auto my-4 p-4 sm:w-fit w-full border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between">
        <button class="flex gap-2 cursor-pointer items-center" @click="profileInfoOpen = true">
          <span class="text-xl"><ProfilePicture :profile /></span>
          <span>{{ profile?.username }}</span>
        </button>
        <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex justify-center my-4 text-sm">
        <button
          v-for="tab in tabs"
          @click="setActiveTab(tab)"
          :class="[
            'inline-flex w-full items-center gap-2 cursor-pointer border-b-2 justify-center p-2 transition-all hover:text-neutral-200 ',
            activeTab === tab ? 'border-current' : 'border-transparent text-neutral-400',
          ]"
        >
          <span class="size-5">
            <PaletteIcon v-if="tab === 'placed'" />
            <CollectionIcon v-else />
          </span>
          <span class="capitalize sm:inline hidden">{{ tab }}</span>
          <span class="text-xs text-neutral-400 bg-neutral-800 px-1 rounded-full">
            {{ profile?.[`artworks_${tab}_count`] }}
          </span>
        </button>
      </div>

      <div class="relative">
        <div
          v-if="selectedArtwork"
          class="absolute top-0 h-[calc(100vh-160px)] w-full bg-black/50 backdrop-blur-lg z-10 overflow-y-auto"
          @click="selectedArtwork = null"
        >
          <div class="m-auto mt-8 w-4/5" @click.stop>
            <div class="border border-neutral-600 rounded-t-lg bg-black p-2 flex justify-between">
              <ProfileCard :user-id="selectedArtwork.user_id" />
              <router-link
                class="size-6 cursor-pointer shrink-0"
                :to="`/c/${selectedArtwork.canvas_id}?x=${selectedArtwork.x}&y=${selectedArtwork.y}&selected`"
              >
                <LocationIcon />
              </router-link>
            </div>
            <div class="" :style="{ background: CANVAS_BACKGROUND }">
              <ArtworkThumbnail :artwork="selectedArtwork" />
            </div>
            <div
              class="border border-neutral-600 rounded-b-lg bg-black p-2 text-xs text-neutral-400"
            >
              {{ getArtworkStatus(selectedArtwork) }}
              <template v-if="selectedArtwork.collected_by">
                by
                <span v-if="selectedArtwork.collected_by === authStore.user?.id">You</span>
                <ProfileCard v-else :user-id="selectedArtwork.collected_by" />
              </template>
            </div>
          </div>
        </div>
        <div
          v-if="profileInfoOpen"
          class="absolute top-0 h-[calc(100vh-160px)] w-full bg-black/50 backdrop-blur-2xl z-10 overflow-y-auto p-4"
        >
          <div class="text-right">
            <button @click="profileInfoOpen = false" class="cursor-pointer size-6">
              <XMarkIcon />
            </button>
          </div>
          {{ profile?.bio }}
        </div>
      </div>

      <!-- Content Area -->
      <div class="h-[calc(100vh-160px)] overflow-y-scroll">
        <!-- Loading state -->
        <div v-if="isLoading && currentArtworks.length === 0" class="grid grid-cols-4 gap-1">
          <div
            v-for="i in ITEMS_PER_PAGE"
            :key="i"
            class="bg-neutral-800 animate-pulse aspect-square sm:w-32"
          />
        </div>

        <!-- Empty state -->
        <div v-else-if="currentArtworks.length === 0" class="text-center my-14 mx-auto max-w-80">
          <template v-if="activeTab === 'placed'">
            <div class="max-w-32 mx-auto mb-4 text-neutral-400">
              <PaletteIcon />
            </div>
            <h3 class="text-xl my-2">No artworks created yet</h3>
            <p v-if="userId === authStore.user?.id" class="my-6 text-sm">
              Start creating and placing your first pixel art on the canvas!
            </p>
          </template>
          <template v-else>
            <div class="max-w-32 mx-auto mb-4 text-neutral-400">
              <CollectionIcon />
            </div>
            <h3 class="text-xl my-2">No artworks collected yet</h3>
            <p v-if="userId === authStore.user?.id" class="my-6 text-sm">
              Explore the canvas and collect interesting artworks before they expire!
            </p>
          </template>
        </div>

        <!-- Artworks Grid -->
        <div v-else class="grid grid-cols-4 gap-1">
          <div
            v-for="artwork in currentArtworks"
            :key="artwork.id"
            class="aspect-square overflow-hidden cursor-pointer sm:w-32"
            :style="{ background: CANVAS_BACKGROUND }"
            tabindex="0"
            @click="selectedArtwork = artwork"
          >
            <ArtworkThumbnail
              :artwork="artwork"
              :show-status="true"
              :show-timer="activeTab === 'placed'"
            />
          </div>
        </div>

        <!-- Load More Button -->
        <div
          v-if="hasMore[activeTab].value && currentArtworks.length > 0"
          class="mt-1 p-2 text-center text-sm"
        >
          <button
            @click="loadMore"
            :disabled="isLoadingMore"
            class="cursor-pointer flex w-full gap-2 items-center justify-center disabled:cursor-not-allowed py-2 border border-dashed border-neutral-600"
          >
            <div
              v-if="isLoadingMore"
              class="size-4 animate-spin rounded-full border-2 border-t-transparent"
            />
            {{ isLoadingMore ? 'Loading...' : `Load more` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ArtworkThumbnail from '../Artwork/ArtworkThumbnail.vue'
import type { Artwork } from '@/shared/types'
import { formatRelativeTime, getH_M_S } from '@/utils/date'
import { artworkApi } from '@/services/api'
import XMarkIcon from '../Icons/XMarkIcon.vue'
import { CANVAS_BACKGROUND } from '@/stores/canvas'
import PaletteIcon from '../Icons/PaletteIcon.vue'
import CollectionIcon from '../Icons/CollectionIcon.vue'
import { useProfile } from '@/stores/profiles'
import LocationIcon from '../Icons/LocationIcon.vue'
import ProfilePicture from './ProfilePicture.vue'
import ProfileCard from './ProfileCard.vue'

const { userId } = defineProps<{
  userId: string
}>()

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

const authStore = useAuthStore()
const { profile, isLoading: profileLoading, refresh } = useProfile(userId)

const tabs = ['placed', 'collected'] as const
const activeTab = ref<'placed' | 'collected'>('placed')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const selectedArtwork = ref<Artwork | null>(null)
const profileInfoOpen = ref(false)

const ITEMS_PER_PAGE = 16

const artworks = { placed: ref<Artwork[]>([]), collected: ref<Artwork[]>([]) }
const page = { placed: ref(1), collected: ref(1) }
const hasMore = { placed: ref(true), collected: ref(true) }

const currentArtworks = computed(() => artworks[activeTab.value].value)

async function setActiveTab(tab: 'placed' | 'collected') {
  selectedArtwork.value = null
  if (activeTab.value === tab) return

  activeTab.value = tab

  if (artworks[tab].value.length === 0) {
    await loadArtworks(true)
  }
}

async function loadArtworks(reset: boolean = false) {
  const isInitialLoad = reset || currentArtworks.value.length === 0

  if (isInitialLoad) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const pageNum = reset ? 1 : page[activeTab.value].value
    const { artworks: loadedArtworks } = await artworkApi.getUserArtworks(
      activeTab.value,
      pageNum,
      ITEMS_PER_PAGE,
    )
    const more =
      loadedArtworks.length === ITEMS_PER_PAGE &&
      pageNum * ITEMS_PER_PAGE < profile.value?.[`artworks_${activeTab.value}_count`]!

    if (reset) {
      artworks[activeTab.value].value = loadedArtworks
      page[activeTab.value].value = 1
    } else {
      artworks[activeTab.value].value.push(...loadedArtworks)
    }
    hasMore[activeTab.value].value = more
    page[activeTab.value].value++
  } catch (error) {
    console.error('Failed to load artworks:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function loadMore() {
  if (!hasMore[activeTab.value].value || isLoadingMore.value) return
  await loadArtworks(false)
}

function getArtworkStatus(artwork: Artwork) {
  if (artwork.collected_by) {
    return 'Collected ' + formatRelativeTime(artwork.collected_at)
  }
  const timeRemaining = new Date(artwork.expires_at).getTime() - Date.now()
  if (timeRemaining > 0) {
    const { hours, minutes } = getH_M_S(timeRemaining)
    return (hours > 0 ? `${hours}h ` : '') + `${minutes}m left`
  }
  return 'Expired ' + formatRelativeTime(artwork.expires_at)
}

// Lifecycle
onMounted(async () => {
  await loadArtworks(true)
})
</script>
