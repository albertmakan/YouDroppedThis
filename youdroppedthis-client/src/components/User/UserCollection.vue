<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div
      class="bg-black text-neutral-200 rounded-lg shadow-lg mx-auto my-4 p-4 w-fit border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between">
        <div class="flex gap-2">
          <div class="rounded-full bg-teal-800 size-6 text-white text-center">
            {{ profile?.username?.charAt(0) }}
          </div>
          <span class="">{{ profile?.username }}</span>
        </div>
        <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex justify-center my-4 text-sm">
        <div v-for="tab in tabs" class="flex-1">
          <button
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
            <span class="capitalize">{{ tab }}</span>
            <span class="text-xs text-neutral-400 bg-neutral-800 px-1 rounded-full">
              {{ profile?.[`artworks_${tab}_count`] }}
            </span>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="h-[calc(100vh-160px)] max-w-80 overflow-y-auto">
        <!-- Loading state -->
        <div v-if="isLoading && currentArtworks.length === 0" class="grid grid-cols-4 gap-1">
          <div
            v-for="i in ITEMS_PER_PAGE"
            :key="i"
            class="bg-neutral-700 animate-pulse aspect-square"
          />
        </div>

        <!-- Empty state -->
        <div v-else-if="currentArtworks.length === 0" class="text-center my-14">
          <template v-if="activeTab === 'placed'">
            <div class="mx-24 mb-4 text-neutral-400">
              <PaletteIcon />
            </div>
            <h3 class="text-xl my-2">No artworks created yet</h3>
            <p v-if="userId === authStore.user?.id" class="my-6 text-sm">
              Start creating and placing your first pixel art on the canvas!
            </p>
          </template>
          <template v-else>
            <div class="mx-24 mb-4 text-neutral-400">
              <CollectionIcon />
            </div>
            <h3 class="text-xl my-2">No artworks collected yet</h3>
            <p v-if="userId === authStore.user?.id" class="my-6 text-sm">
              Explore the canvas and collect interesting artworks before they expire!
            </p>
          </template>
        </div>

        <!-- Artworks Grid -->
        <div v-else class="grid grid-cols-4 gap-1" :style="{ background: CANVAS_BACKGROUND }">
          <div
            v-for="artwork in currentArtworks"
            :key="artwork.id"
            class="relative aspect-square overflow-hidden cursor-pointer"
            tabindex="0"
            @click="openArtworkDetail(artwork)"
          >
            <ArtworkThumbnail
              :artwork="artwork"
              :show-status="true"
              :show-timer="activeTab === 'placed'"
            />

            <!-- Overlay info -->
            <div
              class="absolute inset-0 opacity-0 text-white bg-black/50 hover:opacity-100 transition-all"
            >
              <div class="text-xs font-semibold- m-2-">
                <span
                  v-if="activeTab === 'placed'"
                  class="px-1 py-0.5 bg-neutral-600/50 rounded-lg"
                >
                  {{ getArtworkStatus(artwork) }}
                </span>
                <span v-else class="px-1 py-0.5 bg-neutral-600/50 rounded-lg">
                  Collected {{ formatRelativeTime(artwork.collected_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div
          v-if="hasMore[activeTab].value && currentArtworks.length > 0"
          class="mt-1 text-center text-sm"
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
import { useRouter } from 'vue-router'
import { artworkApi } from '@/services/api'
import XMarkIcon from '../Icons/XMarkIcon.vue'
import { CANVAS_BACKGROUND } from '@/stores/canvas'
import PaletteIcon from '../Icons/PaletteIcon.vue'
import CollectionIcon from '../Icons/CollectionIcon.vue'
import { useProfile } from '@/stores/profiles'

const { userId } = defineProps<{
  userId: string
}>()

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

const router = useRouter()

const authStore = useAuthStore()
const { profile, isLoading: profileLoading } = useProfile(userId)

const tabs = ['placed', 'collected'] as const
const activeTab = ref<'placed' | 'collected'>('placed')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const selectedArtworkId = ref<number | null>(null)
const showDetailModal = ref(false)

const ITEMS_PER_PAGE = 16

const artworks = { placed: ref<Artwork[]>([]), collected: ref<Artwork[]>([]) }
const page = { placed: ref(1), collected: ref(1) }
const hasMore = { placed: ref(true), collected: ref(true) }

const currentArtworks = computed(() => artworks[activeTab.value].value)

async function setActiveTab(tab: 'placed' | 'collected') {
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

function openArtworkDetail(artwork: Artwork) {
  selectedArtworkId.value = artwork.id
  showDetailModal.value = true
  if (!artwork.is_expired && !artwork.collected_by)
    router.push({ query: { x: artwork.x, y: artwork.y } })
}

function getArtworkStatus(artwork: Artwork): string {
  if (artwork.collected_by) {
    return 'Collected'
  }
  const timeRemaining = new Date(artwork.expires_at).getTime() - Date.now()
  if (timeRemaining > 0) {
    const { hours, minutes } = getH_M_S(timeRemaining)
    return (hours > 0 ? `${hours}h ` : '') + `${minutes}m left`
  }
  return 'Expired'
}

// Lifecycle
onMounted(async () => {
  await loadArtworks(true)
})
</script>
