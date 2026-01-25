<template>
  <div class="fixed inset-0 flex items-center z-50 bg-black/50">
    <div
      class="bg-black text-neutral-200 rounded-lg shadow-lg mx-auto my-4 p-4 sm:w-fit w-full border border-neutral-600"
      @click.stop
    >
      <div class="flex w-full justify-between">
        <button class="flex gap-2 cursor-pointer items-center" @click="profileInfoOpen = true">
          <span class="text-xl"><ProfilePicture :profile /></span>
          <span
            v-if="profileLoading"
            class="bg-neutral-700 animate-pulse rounded-md w-[8em] h-[1em]"
          />
          <span v-else class="">{{ profile?.username }}</span>
        </button>
        <button @click="emit('close')" class="cursor-pointer size-6"><XMarkIcon /></button>
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
            <CollectIcon v-else />
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
              <ProfileCard :user-id="selectedArtwork.created_by" />
              <router-link
                class="size-6 cursor-pointer shrink-0"
                :to="`/c/${selectedArtwork.canvas_id}?x=${selectedArtwork.x}&y=${selectedArtwork.y}&selected`"
              >
                <LocationIcon />
              </router-link>
            </div>
            <div class="bg-zinc-900" :style="{ backgroundColor: selectedArtwork.pixel_data.bg }">
              <ArtworkThumbnail :offscreen-canvas="selectedArtwork.offscreenCanvas" />
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
          class="absolute top-0 h-[calc(100vh-160px)] w-full bg-black/50 backdrop-blur-2xl z-10 overflow-y-auto p-4 whitespace-pre-wrap"
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
        <div v-if="!data?.pages.length" class="grid grid-cols-4 gap-1">
          <div
            v-for="i in ITEMS_PER_PAGE"
            :key="i"
            class="bg-neutral-800 animate-pulse aspect-square sm:w-32"
          />
        </div>

        <!-- Empty state -->
        <div v-else-if="!data?.pages[0].artworks.length" class="text-center my-14 mx-auto max-w-80">
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
              <CollectIcon />
            </div>
            <h3 class="text-xl my-2">No artworks collected yet</h3>
            <p v-if="userId === authStore.user?.id" class="my-6 text-sm">
              Explore the canvas and collect interesting artworks before they expire!
            </p>
          </template>
        </div>

        <!-- Artworks Grid -->
        <div v-else class="grid grid-cols-4 gap-1">
          <template v-for="page in data?.pages">
            <div
              v-for="artwork in page.artworks"
              :key="artwork.id"
              :class="[
                'aspect-square overflow-hidden cursor-pointer sm:w-32 bg-zinc-900',
                artwork.is_expired ? 'opacity-40' : '',
              ]"
              :style="{ backgroundColor: artwork.pixel_data.bg }"
              tabindex="0"
              @click="selectedArtwork = artwork"
            >
              <ArtworkThumbnail :offscreen-canvas="artwork.offscreenCanvas" />
            </div>
          </template>
        </div>

        <!-- Load More Button -->
        <div v-if="hasNextPage" class="mt-1 p-2 text-center text-sm">
          <button
            @click="fetchNextPage()"
            :disabled="isFetchingNextPage"
            class="cursor-pointer flex w-full gap-2 items-center justify-center disabled:cursor-not-allowed py-2 border border-dashed border-neutral-600"
          >
            <div
              v-if="isFetchingNextPage"
              class="size-4 animate-spin rounded-full border-2 border-t-transparent"
            />
            {{ isFetchingNextPage ? 'Loading...' : `Load more` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { Artwork } from '@/shared/types'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfiles'
import { ITEMS_PER_PAGE, useUserArtworks } from '@/composables/useUserArtworks'
import { formatRelativeTime, getH_M_S } from '@/utils/date'
import XMarkIcon from '@/assets/icons/xmark.svg'
import PaletteIcon from '@/assets/icons/palette.svg'
import CollectIcon from '@/assets/icons/collect.svg'
import LocationIcon from '@/assets/icons/location.svg'
import ArtworkThumbnail from '@/components/Artwork/ArtworkThumbnail.vue'
import ProfilePicture from './ProfilePicture.vue'
import ProfileCard from './ProfileCard.vue'

const props = defineProps<{ userId: string }>()

const { data: profile, isLoading: profileLoading } = useProfile(toRef(props, 'userId'))

const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()

const tabs = ['placed', 'collected'] as const
const activeTab = ref<'placed' | 'collected'>('placed')
const selectedArtwork = ref<Artwork | null>(null)
const profileInfoOpen = ref(false)

async function setActiveTab(tab: 'placed' | 'collected') {
  selectedArtwork.value = null
  activeTab.value = tab
}

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserArtworks(
  toRef(props, 'userId'),
  activeTab,
)

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
</script>
