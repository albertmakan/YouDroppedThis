<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div class="max-h-screen overflow-y-auto w-full">
      <div
        class="bg-neutral-800 text-neutral-200 rounded-lg shadow-lg flex flex-col items-center m-auto gap-4 p-4 w-fit"
        @click.stop
      >
        <div class="flex w-full justify-end text-2xl">
          <button @click="closeModal" class="cursor-pointer size-6"><XMarkIcon /></button>
        </div>
        <!-- Header with stats -->
        <div class="">
          <h2 class="text-xl">{{ authStore.user?.username }}'s Gallery</h2>
          <div class="flex justify-center my-2 text-neutral-400 gap-2">
            <span>
              <strong>{{ total.placed }}</strong> placed
            </span>
            <span>•</span>
            <span>
              <strong>{{ total.collected }}</strong> collected
            </span>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="mb-4">
          <div class="flex justify-center">
            <button
              v-for="tab in ['placed', 'collected']"
              @click="setActiveTab(tab as keyof typeof artworks)"
              :class="[
                'flex items-center gap-2 cursor-pointer border-b-2 font-semibold px-4 py-2 transition-all hover:text-neutral-200',
                {
                  'border-transparent text-neutral-400': activeTab !== tab,
                  'border-current': activeTab === tab,
                },
              ]"
            >
              <span class="tab-icon">{{ tab === 'placed' ? '🎨' : '📦' }}</span>
              <span class="capitalize">{{ tab }}</span>
            </button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="min-h-96 w-64">
          <!-- Loading state -->
          <div v-if="isLoading && currentArtworks.length === 0" class="grid grid-cols-3 gap-1">
            <div
              v-for="i in ITEMS_PER_PAGE"
              :key="i"
              class="bg-neutral-700 animate-pulse aspect-square"
            />
          </div>

          <!-- Empty state -->
          <div v-else-if="currentArtworks.length === 0" class="text-center my-14">
            <template v-if="activeTab === 'placed'">
              <div class="empty-icon text-4xl mb-4">🎨</div>
              <h3 class="text-xl my-2">No artworks created yet</h3>
              <p class="my-6 text-sm">
                Start creating and placing your first pixel art on the canvas!
              </p>
              <button @click="$emit('create-artwork')" class="py-3 px-4 rounded-md border-2">
                Create Your First Artwork
              </button>
            </template>
            <template v-else>
              <div class="empty-icon text-4xl mb-4">📦</div>
              <h3 class="text-xl my-2">No artworks collected yet</h3>
              <p class="my-6 text-sm">
                Explore the canvas and collect interesting artworks before they expire!
              </p>
            </template>
          </div>

          <!-- Artworks Grid -->
          <div v-else class="grid grid-cols-3 gap-1">
            <div
              v-for="artwork in currentArtworks"
              :key="artwork.id"
              class="relative aspect-square overflow-hidden cursor-pointer"
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
                <div class="text-xs font-semibold m-2">
                  <span
                    v-if="activeTab === 'placed'"
                    class="px-2 py-0.5 bg-neutral-600/50 rounded-lg"
                  >
                    {{ getArtworkStatus(artwork) }}
                  </span>
                  <span v-else class="px-2 py-0.5 bg-neutral-600/50 rounded-lg">
                    Collected {{ formatRelativeTime(artwork.collected_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More Button -->
          <div
            v-if="hasMore[activeTab].value && currentArtworks.length > 0"
            class="mt-4 text-center"
          >
            <button
              @click="loadMore"
              :disabled="isLoadingMore"
              class="cursor-pointer inline-flex gap-2 items-center disabled:cursor-not-allowed"
            >
              <div
                v-if="isLoadingMore"
                class="size-4 animate-spin rounded-full border-2 border-t-transparent"
              />
              {{ isLoadingMore ? 'Loading...' : `Load More (${remainingCount} left)` }}
            </button>
          </div>
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

const emit = defineEmits<{
  close: []
  'create-artwork': []
}>()

function closeModal() {
  emit('close')
}

const authStore = useAuthStore()
const router = useRouter()

// Component state
const activeTab = ref<'placed' | 'collected'>('placed')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const selectedArtwork = ref<Artwork | null>(null)
const showDetailModal = ref(false)

const ITEMS_PER_PAGE = 12

const artworks = { placed: ref<Artwork[]>([]), collected: ref<Artwork[]>([]) }
const page = { placed: ref(1), collected: ref(1) }
const hasMore = { placed: ref(true), collected: ref(true) }
const total = { placed: ref(0), collected: ref(0) }

// Computed properties
const currentArtworks = computed(() => artworks[activeTab.value].value)

const remainingCount = computed(() => {
  const current = currentArtworks.value.length
  return Math.max(0, total[activeTab.value].value - current)
})

// Methods
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
    const response = await artworkApi.getUserArtworks(activeTab.value, pageNum, ITEMS_PER_PAGE)
    if (response) {
      const { artworks: loadedArtworks, total: totalCount } = response
      const more = loadedArtworks.length === ITEMS_PER_PAGE && pageNum * ITEMS_PER_PAGE < totalCount

      if (reset) {
        artworks[activeTab.value].value = loadedArtworks
        page[activeTab.value].value = 1
      } else {
        artworks[activeTab.value].value.push(...loadedArtworks)
      }
      hasMore[activeTab.value].value = more
      total[activeTab.value].value = totalCount
      page[activeTab.value].value++
    }
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
  selectedArtwork.value = artwork
  showDetailModal.value = true
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
