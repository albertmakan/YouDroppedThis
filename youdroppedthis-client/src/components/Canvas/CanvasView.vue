<template>
  <div class="w-full h-screen overflow-hidden">
    <div class="fixed bottom-0 left-0 p-2 z-10">
      <div
        v-if="showInfo"
        class="text-xs backdrop-blur-xl text-neutral-200 bg-black/50 p-1 rounded-md"
      >
        <div>
          📍 Center: ({{ Math.floor((viewBounds.x1 + viewBounds.x2) / 2) }},
          {{ Math.floor((viewBounds.y1 + viewBounds.y2) / 2) }})
        </div>
        <div>
          📐 Bounds: ({{ viewBounds.x1 }}, {{ viewBounds.y1 }}) – ({{ viewBounds.x2 }},
          {{ viewBounds.y2 }})
        </div>
        <div>
          🔍 Zoom: {{ Math.round(zoom * 100) }}%
          <button @click="resetZoom" class="cursor-pointer hover:underline">Reset</button>
        </div>
        <div>🎨 Visible artworks: {{ visibleArtworks }}</div>
        <div>🔌 Realtime: {{ subscription?.state }}</div>
      </div>
      <button
        @click="showInfo = !showInfo"
        class="rounded-full px-2 py-1 border border-neutral-600 backdrop-blur-xl text-neutral-200 text-xs bg-black/50 cursor-pointer"
      >
        📍({{ Math.floor((viewBounds.x1 + viewBounds.x2) / 2) }},
        {{ Math.floor((viewBounds.y1 + viewBounds.y2) / 2) }})
        <span class="text-neutral-500">•</span>
        🔍{{ Math.round(zoom * 100) }}%
      </button>
      <button
        @click="toggleBoxSelection"
        class="mt-2 rounded-full px-2 py-1 border border-neutral-600 backdrop-blur-xl text-neutral-200 text-xs bg-black/50 cursor-pointer"
        :class="isBoxSelectionActive ? 'bg-primary/30 border-primary' : ''"
      >
        Box select
        <span v-if="boxSelectionBounds" class="text-neutral-400 ml-1">
          ({{ boxSelectionBounds.minX }}, {{ boxSelectionBounds.minY }})–({{
            boxSelectionBounds.maxX
          }}, {{ boxSelectionBounds.maxY }})
        </span>
      </button>
    </div>

    <div v-if="authStore.isAuthenticated" class="fixed bottom-0 right-0 p-2 z-20">
      <button
        v-if="(!isEditorOpen || !editorRelativeLocation || editorLocationTaken) && editorLocation"
        @click="reopenEditor"
        class="group relative size-16 hover:scale-110 rounded-md border-2 border-dashed cursor-pointer"
        :style="{ borderColor: gridColor }"
      >
        <ArtworkThumbnail :offscreen-canvas="editorStore.offscreenCanvas" />
        <template v-if="editorLocationTaken">
          <div class="absolute -top-2 -left-2 rounded-full bg-code-warn size-4" />
          <div
            class="absolute bottom-full mb-2 -left-1/2 group-focus:block hidden text-xs p-1 backdrop-blur-xl bg-black/50 text-code-warn rounded-md"
          >
            Select another location, current one is taken
          </div>
        </template>
      </button>
    </div>

    <div v-if="hasEnded" class="fixed top-10 left-0 w-full z-10 px-10">
      <div class="backdrop-blur-xl bg-black/50 border border-secondary p-3 rounded-lg text-center">
        <p class="text-neutral-300">This moment has ended</p>
        <p class="text-sm text-neutral-400 my-3">No new drops can be placed here.</p>
        <div
          v-if="
            canvasInfo?.canvas.created_by && canvasInfo.canvas.created_by === authStore.user?.id
          "
        >
          <p v-if="!canvasInfo.canvas.reward_claimed_at">You can now claim the hosting reward.</p>
          <HostRewardButton
            :canvas-id="props.canvasId"
            :claimed="!!canvasInfo.canvas.reward_claimed_at"
          />
        </div>
      </div>
    </div>
    <div v-if="isCanvasError" class="fixed top-10 left-0 w-full z-10 px-10">
      <div class="backdrop-blur-xl bg-black/50 border border-secondary p-3 rounded-lg text-center">
        <p class="text-neutral-300">This moment isn’t here</p>
        <p class="text-sm text-neutral-400 my-3">
          The canvas you’re looking for has already ended, or it never existed in the first place.
        </p>
        <router-link to="/now" class="text-neutral-300 hover:underline">
          Explore active moments
        </router-link>
      </div>
    </div>

    <canvas
      ref="canvasRef"
      :width="viewportWidth"
      :height="viewportHeight"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @wheel.prevent="handleWheel"
      @touchstart.passive="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @contextmenu.prevent
      @click.prevent
      @dblclick.prevent="handleClickLocation"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
      style="image-rendering: pixelated"
    />
    <div
      v-if="isBoxSelectionActive && boxPreviewRect"
      class="fixed pointer-events-none border-2 border-dashed"
      :style="{
        left: `${boxPreviewRect.left}px`,
        top: `${boxPreviewRect.top}px`,
        width: `${boxPreviewRect.width}px`,
        height: `${boxPreviewRect.height}px`,
        borderColor: gridColor,
      }"
    />
    <div
      v-if="boxSelectionBounds && boxSelectionRect"
      class="fixed z-30 pointer-events-none border-2"
      :style="{
        left: `${boxSelectionRect.left}px`,
        top: `${boxSelectionRect.top}px`,
        width: `${boxSelectionRect.width}px`,
        height: `${boxSelectionRect.height}px`,
        borderColor: gridColor,
      }"
    />
    <div
      v-if="boxSelectionBounds && boxSelectionRect"
      class="fixed z-30"
      :style="{
        left: `${boxSelectionRect.left}px`,
        top: `${Math.max(boxSelectionRect.top - 64, 0)}px`,
      }"
    >
      <div
        class="pointer-events-auto backdrop-blur-xl bg-black/70 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-200 flex flex-col gap-1"
      >
        <div>
          Box: ({{ boxSelectionBounds.minX }}, {{ boxSelectionBounds.minY }}) – ({{
            boxSelectionBounds.maxX
          }}, {{ boxSelectionBounds.maxY }})
        </div>
        <div class="flex gap-2">
          <button
            class="border border-neutral-500 rounded px-2 py-1 cursor-pointer hover:bg-neutral-700"
            @click="handleExportSelection"
            :disabled="isExportingSelection"
          >
            {{ isExportingSelection ? 'Exporting…' : 'Export as PNG' }}
          </button>
          <span v-if="canModerate" class="relative">
            <button class="peer border border-neutral-500 rounded px-2 py-1 cursor-pointer hover:bg-neutral-700">
              Moderate
            </button>
            <div
              class="peer-focus:block hidden active:block focus:block focus-within:block absolute left-0 top-full mt-1 z-10 bg-black border border-neutral-600 rounded-lg shadow-md p-1 w-max"
              tabindex="0"
            >
              <button
                class="w-full text-left text-red-400 rounded px-2 py-1 cursor-pointer hover:bg-red-900/40 disabled:opacity-50 text-xs"
                :disabled="isModeratingSelection"
                @click="handleModerateSelection"
              >
                {{ isModeratingSelection ? 'Removing…' : 'Remove selection' }}
              </button>
            </div>
          </span>
          <button class="cursor-pointer size-6" @click="clearBoxSelection">
            <XMarkIcon />
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="locationPreview && !selectedLocation?.artwork"
      class="fixed pointer-events-none border-2 border-current border-dashed"
      :style="{
        left: `${locationPreview.x}px`,
        top: `${locationPreview.y}px`,
        width: `${zoomedArtSize}px`,
        height: `${zoomedArtSize}px`,
        color: gridColor,
      }"
    >
      <div class="relative">
        <div class="absolute bottom-1 text-xs text-nowrap">
          ({{ selectedLocation?.x }}, {{ selectedLocation?.y }})
        </div>
      </div>
      <span v-if="hasEnded" class="size-1/2 inline-block" />
      <button
        v-else
        @click="openEditorAtNewLocation"
        class="pointer-events-auto cursor-pointer size-1/2 hover:scale-105"
      >
        <DrawIcon />
      </button>
      <button
        @click="selectedLocation = null"
        class="pointer-events-auto cursor-pointer size-1/2 hover:scale-105"
      >
        <XMarkIcon />
      </button>
    </div>
    <ArtworkInfoPopup
      v-if="locationPreview && selectedLocation?.artwork"
      :artwork="selectedLocation.artwork"
      @collect="collectArtwork"
      :top="locationPreview.y"
      :left="locationPreview.x"
      :size="zoomedArtSize"
      :collect-disabled="activityInfo?.recentActivity.some(({ kind }) => kind === 'collection')"
    />
    <PixelArtEditorPopup
      v-if="canvasInfo && isEditorOpen && editorRelativeLocation && !editorLocationTaken"
      @close="isEditorOpen = false"
      :top="editorRelativeLocation.y"
      :left="editorRelativeLocation.x"
      :size="zoomedArtSize"
      :canvasInfo="canvasInfo.canvas"
      :gridColor
      @wheel="handleWheel"
    >
      <template v-slot:header>
        <div class="text-xs text-neutral-400">
          <template
            v-if="(lastHourPlacementsCount ?? 0) < canvasInfo.canvas.max_artworks_per_user_per_hour"
          >
            <p>
              You can place up to {{ canvasInfo.canvas.max_artworks_per_user_per_hour }} pieces here
              per hour
            </p>
            <p v-if="lastHourPlacementsCount">
              {{ canvasInfo.canvas.max_artworks_per_user_per_hour - lastHourPlacementsCount }} left
            </p>
          </template>
          <p v-else>You’ve placed enough for now. Try again in a little while.</p>
        </div>
      </template>
      <template v-slot:drop>
        <div class="text-xs text-neutral-400">
          <p v-if="allowAnonymousPlacement && !authStore.user">
            Cost: 0 coins • You’re drawing as
            <span class="font-semibold">
              {{ anonymousIdentity?.guestName ?? 'Guest' }}
            </span>
          </p>
          <p v-else>Cost: {{ canvasInfo.canvas.placement_fee }} coins</p>
          <p v-if="!allowAnonymousPlacement && !authStore.user">Please sign in to place artwork</p>
          <p v-else-if="!allowAnonymousPlacement && authStore.user && !authStore.user.confirmed_at">
            Please confirm your account to place artwork
          </p>
          <p v-else-if="!allowAnonymousPlacement && !hasEnoughCoinsToPlace">
            You don’t have enough coins to drop this here. Check the drawer for your daily grant.
          </p>
        </div>
        <button
          v-if="
            (allowAnonymousPlacement || hasEnoughCoinsToPlace) &&
            (lastHourPlacementsCount ?? 0) < canvasInfo.canvas.max_artworks_per_user_per_hour
          "
          @click="placeArtwork"
          :disabled="editorStore.tool === 'code' || !editorStore.isFilledEnough || isPlacing"
          class="border-current border disabled:text-neutral-600 disabled:cursor-not-allowed rounded-md px-2 py-1 cursor-pointer pointer-events-auto text-primary uppercase"
        >
          {{ isPlacing ? 'Dropping...' : 'Drop' }}
        </button>
      </template>
    </PixelArtEditorPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, toRef } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { RealtimeChannel } from '@supabase/realtime-js'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import type { Artwork } from '@/shared/types'
import { useCanvas, useCanvasActivity, useSyncCanvasState } from '@/composables/useCanvases'
import { useCollectArtwork, usePlaceArtwork } from '@/composables/useUserArtworks'
import { useToast } from '@/composables/useToast'
import PixelArtEditorPopup from '@/components/Editor/PixelArtEditorPopup.vue'
import ArtworkThumbnail from '@/components/Artwork/ArtworkThumbnail.vue'
import { createOffscreenCanvas, renderParticles } from '@/components/Artwork/renderArtwork'
import ArtworkInfoPopup from '@/components/Artwork/ArtworkInfoPopup.vue'
import HostRewardButton from '@/components/User/HostRewardButton.vue'
import DrawIcon from '@/assets/icons/draw.svg'
import XMarkIcon from '@/assets/icons/xmark.svg'
import { initializeDisintegrationParticles, updateEffect, updateParticles } from '@/utils/physics'
import f from '@/utils/builtInFunctions'
import { colorToRGBA, rgbToHSL } from '@/utils/color'
import { canvasApi } from '@/services/api'
import { supabase } from '@/services/supabase'

const CHUNK_SIZE = 16
const PLACEHOLDER_BOUNDS = {
  min_x: -CHUNK_SIZE / 2,
  max_x: CHUNK_SIZE / 2 - 1,
  min_y: -CHUNK_SIZE / 2,
  max_y: CHUNK_SIZE / 2 - 1,
} as const
const MIN_ZOOM = 0.25
const MAX_ZOOM = 5
const DEFAULT_BACKGROUND = '#18181b'

const props = defineProps<{
  canvasId: number
  x: number
  y: number
  z?: number
  selected?: boolean
  userId?: string
}>()

const toast = useToast()

const authStore = useAuthStore()
const editorStore = useEditorStore()
const router = useRouter()

const canvasId = toRef(props, 'canvasId')
const { data: canvasInfo, isError: isCanvasError } = useCanvas(canvasId)
const { data: activityInfo } = useCanvasActivity(canvasId, toRef(props, 'userId'))
const { mutate: mutatePlaceArtwork } = usePlaceArtwork(canvasId)
const { mutate: mutateCollectArtwork } = useCollectArtwork(canvasId)
const syncCanvasState = useSyncCanvasState(canvasId)

// Canvas refs and state
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// View state
const viewX = ref(0)
const viewY = ref(0)
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)
const zoom = ref(1)
const lastZoom = ref(1)
const zoomedArtSize = computed(() => 128 * zoom.value)
const zoomedChunkSize = computed(() => zoomedArtSize.value * CHUNK_SIZE)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const initialPinchDistance = ref<number | null>(null)
const showInfo = ref(false)
const editorLocationTaken = ref(false)
const isEditorOpen = ref(false)
const isPlacing = ref(false)
const editorLocation = ref<{ x: number; y: number } | null>(null)

const now = ref(new Date().toISOString())
const hasEnded = computed(() => canvasInfo.value?.canvas.accepting_artworks === false)
const allowAnonymousPlacement = computed(
  () => canvasInfo.value?.canvas.allow_anonymous_placement ?? false,
)
const anonymousIdentity = computed(() =>
  allowAnonymousPlacement.value ? authStore.getGuestIdentity(canvasId.value) : null,
)
const lastHourPlacementsCount = computed(() => {
  const oneHourAgo = new Date(Date.parse(now.value) - 3_600_000).toISOString()
  const lastHourCount = activityInfo.value?.recentActivity.reduce(
    (count, { event_time, kind }) =>
      kind === 'placement' && event_time > oneHourAgo ? count + 1 : count,
    0,
  )
  return lastHourCount
})
const hasEnoughCoinsToPlace = computed(
  () => (authStore.user?.balance ?? 0) > (canvasInfo.value?.canvas.placement_fee ?? 0),
)

const viewBounds = computed(() => ({
  x1: Math.floor(viewX.value / zoomedArtSize.value),
  x2: Math.floor((viewX.value + viewportWidth.value) / zoomedArtSize.value),
  y1: Math.floor(viewY.value / zoomedArtSize.value),
  y2: Math.floor((viewY.value + viewportHeight.value) / zoomedArtSize.value),
}))
const canvasBounds = computed(() => canvasInfo.value?.canvas ?? PLACEHOLDER_BOUNDS)

const chunks = new Map<string, { artworks?: Artwork[]; isLoading: boolean }>()
const subscription = ref<RealtimeChannel | null>(null)

function subscribeToCanvas(canvasId: number) {
  const channel = supabase.channel(`canvas:${canvasId}`, { config: { private: true } })
  channel
    .on('broadcast', { event: '*' }, ({ payload, event }) => handleRealtimeEvent(event, payload))
    .subscribe()
  subscription.value = channel
}

async function unsubscribeFromCanvas() {
  if (subscription.value) {
    await subscription.value.unsubscribe()
    subscription.value = null
  }
}

function handleRealtimeEvent(event: string, payload: any) {
  if (event === 'placed') {
    const artwork = payload as Artwork
    getChunkByCoords(artwork.x, artwork.y)?.artworks?.push(artwork)
    if (editorLocation.value?.x === artwork.x && editorLocation.value.y === artwork.y) {
      editorLocationTaken.value = true
    }
    syncCanvasState({ last_artwork_at: artwork.created_at })
  } else if (event === 'collected') {
    const { x, y, id, collected_at, collected_by, collector } = payload as Artwork
    const collected = getChunkByCoords(x, y)?.artworks?.find((a) => a.id === id)
    if (collected) {
      collected.collected_by = collected_by
      collected.collected_at = collected_at
      collected.collectionEffect = { progress: 0 }
      collected.collector = collector
    }
  } else if (event === 'area_cleared') {
    const { minX, maxX, minY, maxY } = payload as {
      minX: number
      maxX: number
      minY: number
      maxY: number
    }
    const { min_x, min_y } = canvasBounds.value
    const cx1 = Math.floor((minX - min_x) / CHUNK_SIZE)
    const cx2 = Math.floor((maxX - 1 - min_x) / CHUNK_SIZE)
    const cy1 = Math.floor((minY - min_y) / CHUNK_SIZE)
    const cy2 = Math.floor((maxY - 1 - min_y) / CHUNK_SIZE)
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const chunk = chunks.get(getChunkKey(cx, cy))
        if (!chunk?.artworks) continue
        for (const artwork of chunk.artworks) {
          if (artwork.is_expired || artwork.collected_by) continue
          if (artwork.x < minX || artwork.x >= maxX) continue
          if (artwork.y < minY || artwork.y >= maxY) continue
          artwork.is_expired = true
          artwork.particles = initializeDisintegrationParticles()
        }
      }
    }
  }
}

function getChunkKey(cx: number, cy: number) {
  return `${cx},${cy}`
}

function getChunk(cx: number, cy: number) {
  return chunks.get(getChunkKey(cx, cy))
}

function getChunkByCoords(x: number, y: number) {
  const { min_x, min_y } = canvasBounds.value
  const cx = Math.floor((x - min_x) / CHUNK_SIZE)
  const cy = Math.floor((y - min_y) / CHUNK_SIZE)
  return getChunk(cx, cy)
}

function getArtworkAt(x: number, y: number) {
  const artworksInChunk = getChunkByCoords(x, y)?.artworks
  if (!artworksInChunk) return
  return (
    artworksInChunk.find((a) => x === a.x && y === a.y && !a.is_expired && !a.collected_by) || null
  )
}

// Selection state
const selectedLocation = ref<{ x: number; y: number; artwork: Artwork | null } | null>(null)
const locationPreview = computed(
  () => selectedLocation.value && getArtworkRelativeCoordinates(selectedLocation.value),
)
const editorRelativeLocation = computed(
  () =>
    editorLocation.value &&
    (isOutsideViewport(editorLocation.value.x, editorLocation.value.y)
      ? null
      : getArtworkRelativeCoordinates(editorLocation.value)),
)

// Box selection state
const isBoxSelectionActive = ref(false)
const boxCornerStart = ref<{ x: number; y: number } | null>(null)
const boxCornerEnd = ref<{ x: number; y: number } | null>(null)
const boxHoverCoords = ref<{ x: number; y: number } | null>(null)
const isExportingSelection = ref(false)
const isModeratingSelection = ref(false)

const canModerate = computed(
  () =>
    canvasInfo.value?.canvas.created_by === authStore.user?.id &&
    canvasInfo.value?.canvas.placement_fee === 0,
)

const boxSelectionBounds = computed(() => {
  if (!boxCornerStart.value || !boxCornerEnd.value) return null
  const x1 = boxCornerStart.value.x
  const y1 = boxCornerStart.value.y
  const x2 = boxCornerEnd.value.x
  const y2 = boxCornerEnd.value.y
  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minY: Math.min(y1, y2),
    maxY: Math.max(y1, y2),
  }
})

const boxSelectionRect = computed(() => {
  const bounds = boxSelectionBounds.value
  if (!bounds) return null
  const topLeft = getArtworkRelativeCoordinates({ x: bounds.minX, y: bounds.minY })
  const bottomRight = getArtworkRelativeCoordinates({
    x: bounds.maxX + 1,
    y: bounds.maxY + 1,
  })
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  }
})

const boxPreviewRect = computed(() => {
  if (!isBoxSelectionActive.value || !boxCornerStart.value) return null
  const end = boxCornerEnd.value ?? boxHoverCoords.value
  if (!end) return null
  const minX = Math.min(boxCornerStart.value.x, end.x)
  const maxX = Math.max(boxCornerStart.value.x, end.x)
  const minY = Math.min(boxCornerStart.value.y, end.y)
  const maxY = Math.max(boxCornerStart.value.y, end.y)
  const topLeft = getArtworkRelativeCoordinates({ x: minX, y: minY })
  const bottomRight = getArtworkRelativeCoordinates({ x: maxX + 1, y: maxY + 1 })
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  }
})

const chunksRange = computed(() => {
  const { min_x, max_x, min_y, max_y } = canvasBounds.value
  const cx1 = Math.floor(Math.max(viewX.value / zoomedArtSize.value - min_x, 0) / CHUNK_SIZE)
  const cx2 = Math.floor(
    Math.min((viewX.value + viewportWidth.value) / zoomedArtSize.value - min_x, max_x - min_x) /
      CHUNK_SIZE,
  )
  const cy1 = Math.floor(Math.max(viewY.value / zoomedArtSize.value - min_y, 0) / CHUNK_SIZE)
  const cy2 = Math.floor(
    Math.min((viewY.value + viewportHeight.value) / zoomedArtSize.value - min_y, max_y - min_y) /
      CHUNK_SIZE,
  )
  if (canvasInfo.value) {
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const chunk = getChunk(cx, cy)
        if (!chunk?.artworks && !chunk?.isLoading) {
          const key = getChunkKey(cx, cy)
          chunks.set(key, { isLoading: true })
          canvasApi
            .getArtworksInArea(canvasId.value, {
              minX: cx * CHUNK_SIZE + min_x,
              maxX: (cx + 1) * CHUNK_SIZE + min_x,
              minY: cy * CHUNK_SIZE + min_y,
              maxY: (cy + 1) * CHUNK_SIZE + min_y,
            })
            .then(({ artworks }) => {
              chunks.set(key, { artworks, isLoading: false })
            })
            .catch((error) => {
              console.error('Failed to load chunk:', error)
            })
        }
      }
    }
  }
  return { cx1, cx2, cy1, cy2 }
})

const gridColor = computed(() => {
  const [r, g, b] = colorToRGBA(canvasInfo.value?.canvas.background_color || DEFAULT_BACKGROUND)
  const [h, s, l] = rgbToHSL(r, g, b)
  return `hsl(${h}, ${s}%, ${l + (l > 50 ? -50 : 50)}%)`
})

// Canvas utilities
function getCanvasCoordinates(clientX: number, clientY: number) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (clientX - rect.left + viewX.value) / zoomedArtSize.value
  const y = (clientY - rect.top + viewY.value) / zoomedArtSize.value
  return { x: Math.floor(x), y: Math.floor(y) }
}

function getArtworkRelativeCoordinates(artwork: { x: number; y: number }) {
  return {
    x: artwork.x * zoomedArtSize.value - viewX.value,
    y: artwork.y * zoomedArtSize.value - viewY.value,
  }
}

function setLocation(x: number, y: number, z?: number) {
  zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z ?? zoom.value))
  viewX.value = x * zoomedArtSize.value - (viewportWidth.value - zoomedArtSize.value) / 2
  viewY.value = y * zoomedArtSize.value - (viewportHeight.value - zoomedArtSize.value) / 2
}

function getEventLocation(e: MouseEvent | TouchEvent) {
  if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

function isOutsideViewport(x: number, y: number) {
  const { x1, x2, y1, y2 } = viewBounds.value
  return x < x1 || x > x2 || y < y1 || y > y2
}

function clearBoxSelection() {
  boxCornerStart.value = null
  boxCornerEnd.value = null
  boxHoverCoords.value = null
}

function toggleBoxSelection() {
  isBoxSelectionActive.value = !isBoxSelectionActive.value
  if (!isBoxSelectionActive.value) {
    clearBoxSelection()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, type)
  })
}

async function handleExportSelection() {
  if (!boxSelectionBounds.value) return
  if (isExportingSelection.value) return

  const bounds = boxSelectionBounds.value
  const widthTiles = bounds.maxX - bounds.minX + 1
  const heightTiles = bounds.maxY - bounds.minY + 1
  const area = widthTiles * heightTiles

  if (widthTiles < 1 || heightTiles < 1) {
    toast.warning('Selection is too small to export')
    return
  }
  if (area > 256) {
    toast.warning('Selection is too large to export (max 256 tiles)')
    return
  }

  isExportingSelection.value = true
  try {
    const { min_x, min_y } = canvasBounds.value
    const cx1 = Math.floor((bounds.minX - min_x) / CHUNK_SIZE)
    const cx2 = Math.floor((bounds.maxX - min_x) / CHUNK_SIZE)
    const cy1 = Math.floor((bounds.minY - min_y) / CHUNK_SIZE)
    const cy2 = Math.floor((bounds.maxY - min_y) / CHUNK_SIZE)

    let isMissingAnyChunk = false
    const artworks: Artwork[] = []
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const chunk = getChunk(cx, cy)
        if (!chunk?.artworks) {
          isMissingAnyChunk = true
          continue
        }
        for (const artwork of chunk.artworks) {
          if (artwork.x < bounds.minX || artwork.x > bounds.maxX) continue
          if (artwork.y < bounds.minY || artwork.y > bounds.maxY) continue
          if (artwork.is_expired || artwork.collected_by) continue
          artworks.push(artwork)
        }
      }
    }
    if (isMissingAnyChunk) {
      toast.warning('Some of this area is not loaded yet; export may be incomplete')
    }

    const tileResolution =
      artworks.reduce((acc, a) => {
        const h = a.pixel_data.mat.length || 0
        const w = a.pixel_data.mat[0]?.length ?? 0
        return Math.max(acc, h, w)
      }, 0) || 16

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = widthTiles * tileResolution
    exportCanvas.height = heightTiles * tileResolution
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) {
      toast.error('Failed to export selection')
      return
    }
    exportCtx.imageSmoothingEnabled = false

    for (const artwork of artworks) {
      if (!artwork.offscreenCanvas) {
        artwork.offscreenCanvas = createOffscreenCanvas(artwork.pixel_data)
      }
      const dx = (artwork.x - bounds.minX) * tileResolution
      const dy = (artwork.y - bounds.minY) * tileResolution
      exportCtx.drawImage(
        artwork.offscreenCanvas,
        0,
        0,
        artwork.offscreenCanvas.width,
        artwork.offscreenCanvas.height,
        dx,
        dy,
        tileResolution,
        tileResolution,
      )
    }

    const blob = await canvasToBlob(exportCanvas, 'image/png')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canvas-${canvasId.value}-${bounds.minX}_${bounds.minY}-${bounds.maxX}_${bounds.maxY}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    toast.error('Failed to export selection')
  } finally {
    isExportingSelection.value = false
  }
}

async function handleModerateSelection() {
  if (!boxSelectionBounds.value || isModeratingSelection.value) return

  isModeratingSelection.value = true
  try {
    const bounds = boxSelectionBounds.value
    const { expired } = await canvasApi.expireArtworksInArea(canvasId.value, {
      minX: bounds.minX,
      maxX: bounds.maxX + 1,
      minY: bounds.minY,
      maxY: bounds.maxY + 1,
    })
    clearBoxSelection()
    toast.success(`Removed ${expired} artwork${expired !== 1 ? 's' : ''}`)
  } catch {
    toast.error('Failed to moderate selection')
  } finally {
    isModeratingSelection.value = false
  }
}

function reopenEditor() {
  if (!editorLocation.value) {
    return
  }
  isEditorOpen.value = true
  const { x, y } = editorLocation.value
  if (isOutsideViewport(x, y)) {
    setLocation(x, y)
    updateQueryParams()
  }
}

function openEditorAtNewLocation() {
  if (!selectedLocation.value || selectedLocation.value.artwork) return
  editorLocation.value = selectedLocation.value
  editorLocationTaken.value = false
  isEditorOpen.value = true
  selectedLocation.value = null
}

async function placeArtwork() {
  if (!editorLocation.value) {
    return
  }

  const isAnonymous = allowAnonymousPlacement.value && !authStore.user

  if (!isAnonymous) {
    if (!authStore.user) {
      toast.warning('Please sign in to place artwork')
      return
    } else if (!authStore.user.confirmed_at) {
      toast.warning('Please confirm your account to place artwork')
      return
    }
  }
  isPlacing.value = true
  mutatePlaceArtwork(
    {
      pixelData: editorStore.getPixelData(),
      ...editorLocation.value,
      guestName: isAnonymous ? anonymousIdentity.value?.guestName : undefined,
      guestSessionId: isAnonymous ? anonymousIdentity.value?.guestSessionId : undefined,
    },
    {
      onSuccess: (response) => {
        isEditorOpen.value = false
        editorLocation.value = null
        isPlacing.value = false
        editorStore.clearCanvas(true)
        if (response.userProfile) {
          authStore.setProfileInfo(response.userProfile)
        }
      },
      onError: (error) => {
        toast.error(
          'Failed to place artwork: ' +
            JSON.stringify((error as AxiosError).response?.data, null, 4),
        )
        isPlacing.value = false
      },
    },
  )
}

async function collectArtwork() {
  if (!selectedLocation.value?.artwork) {
    return
  }
  if (!authStore.user) {
    toast.warning('Please sign in to collect artwork')
    return
  } else if (!authStore.user.confirmed_at) {
    toast.warning('Please confirm your account to collect artwork')
    return
  }
  mutateCollectArtwork(selectedLocation.value.artwork.id, {
    onSuccess: (response) => {
      authStore.setProfileInfo(response.userProfile)
    },
    onError: (error) => {
      toast.error(
        'Failed to collect artwork: ' +
          JSON.stringify((error as AxiosError).response?.data, null, 4),
      )
    },
  })
}

// Canvas rendering

const checkeredRes = 4
const oobPattern = computed(() => {
  const oobPatternCanvas = new OffscreenCanvas(checkeredRes, checkeredRes)
  const oobPatternCtx = oobPatternCanvas.getContext('2d')
  oobPatternCtx!.fillStyle = gridColor.value
  for (let si = 0; si < checkeredRes; si++) {
    for (let sj = 0; sj < checkeredRes; sj++) {
      if ((si + sj) % 2 === 0) oobPatternCtx!.fillRect(si, sj, 1, 1)
    }
  }
  return oobPatternCanvas
})

let visibleArtworks = 0,
  renderCount = 0

function renderCanvas() {
  if (!ctx.value || !canvasRef.value) return
  const canvas = canvasRef.value
  const context = ctx.value

  // Clear canvas
  context.fillStyle = canvasInfo.value?.canvas.background_color || DEFAULT_BACKGROUND
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Draw grid
  const gridSize = zoomedArtSize.value
  const { min_x, max_x, min_y, max_y } = canvasBounds.value
  const { x1, y1 } = viewBounds.value
  context.strokeStyle = gridColor.value
  context.lineWidth = 2
  const offsetX = -f.mod(viewX.value, gridSize)
  const offsetY = -f.mod(viewY.value, gridSize)
  const oobRes = zoom.value > 1 ? checkeredRes : checkeredRes / 2
  const oobPatternCanvas = oobPattern.value
  let yi = y1
  for (let y = offsetY; y < canvas.height + gridSize; y += gridSize) {
    let xi = x1
    for (let x = offsetX; x < canvas.width + gridSize; x += gridSize) {
      if (xi < min_x || xi > max_x || yi < min_y || yi > max_y) {
        context.drawImage(oobPatternCanvas, 0, 0, oobRes, oobRes, x, y, gridSize, gridSize)
      } else {
        context.beginPath()
        context.moveTo(x - 0.5, y)
        context.lineTo(x + 0.5, y)
        context.stroke()
      }
      xi += 1
    }
    yi += 1
  }

  if (renderCount % 100 === 0) {
    now.value = new Date().toISOString()
  }
  // Draw artworks
  visibleArtworks = 0
  const { cx1, cx2, cy1, cy2 } = chunksRange.value
  for (let cx = cx1; cx <= cx2; cx++) {
    for (let cy = cy1; cy <= cy2; cy++) {
      const chunk = getChunk(cx, cy)
      if (chunk?.isLoading) {
        const pulse = 0.3 + Math.sin(renderCount * 0.04) * 0.1
        context.fillStyle = `rgba(255, 255, 255, ${pulse})`
        const x = cx * zoomedChunkSize.value - viewX.value
        const y = cy * zoomedChunkSize.value - viewY.value
        context.fillRect(x, y, zoomedChunkSize.value, zoomedChunkSize.value)
      } else {
        chunk?.artworks?.forEach((artwork) => {
          visibleArtworks += drawArtwork(artwork, context, now.value)
        })
      }
    }
  }
  if (
    selectedLocation.value?.artwork?.is_expired ||
    selectedLocation.value?.artwork?.collected_at
  ) {
    selectedLocation.value.artwork = null
  }
  renderCount++
}

/** Render artwork, can mutate it */
function drawArtwork(artwork: Artwork, context: CanvasRenderingContext2D, now: string) {
  if (isOutsideViewport(artwork.x, artwork.y)) {
    return 0
  }
  const { x, y } = getArtworkRelativeCoordinates(artwork)
  const resolution = artwork.pixel_data.mat.length || 1
  const pixelSize = zoomedArtSize.value / resolution

  if (!artwork.offscreenCanvas) {
    artwork.offscreenCanvas = createOffscreenCanvas(artwork.pixel_data)
  }
  if (artwork.is_expired) {
    if (!artwork.particles?.length) return 0
    artwork.particles = updateParticles(artwork.particles, Date.now())
    renderParticles(artwork.offscreenCanvas, artwork.particles, context, x, y, pixelSize)
    return 1
  }
  if (artwork.collected_at) {
    if (!artwork.collectionEffect) return 0
    artwork.collectionEffect = updateEffect(artwork.collectionEffect, Date.now()) || undefined
    const remaining = 1 - (artwork.collectionEffect?.progress ?? 1)
    context.drawImage(
      artwork.offscreenCanvas,
      0,
      0,
      resolution,
      remaining * resolution,
      x,
      y,
      zoomedArtSize.value,
      remaining * zoomedArtSize.value,
    )
    return 1
  }
  if (artwork.expires_at < now) {
    artwork.is_expired = true
    artwork.particles = initializeDisintegrationParticles()
  }
  context.drawImage(artwork.offscreenCanvas, x, y, zoomedArtSize.value, zoomedArtSize.value)
  return 1
}

let updateQueryParamsTimeout: number
function updateQueryParams() {
  if (updateQueryParamsTimeout) clearTimeout(updateQueryParamsTimeout)
  updateQueryParamsTimeout = setTimeout(() => {
    const x = (viewX.value + (viewportWidth.value - zoomedArtSize.value) / 2) / zoomedArtSize.value
    const y = (viewY.value + (viewportHeight.value - zoomedArtSize.value) / 2) / zoomedArtSize.value
    const z = zoom.value
    router.replace({ query: { x, y, z } })
  }, 500)
}

function setSelectedLocation(coords: { x: number; y: number }) {
  const { min_x, max_x, min_y, max_y } = canvasBounds.value
  if (coords.x < min_x || coords.x > max_x || coords.y < min_y || coords.y > max_y) {
    return
  }
  const clickedArtwork = getArtworkAt(coords.x, coords.y)
  if (clickedArtwork === undefined) {
    return
  }
  selectedLocation.value = { ...coords, artwork: clickedArtwork }
}

// Event handlers
function handleClickLocation(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)
  if (isBoxSelectionActive.value) {
    const { min_x, max_x, min_y, max_y } = canvasBounds.value
    if (coords.x < min_x || coords.x > max_x || coords.y < min_y || coords.y > max_y) {
      return
    }
    if (!boxCornerStart.value || (boxCornerStart.value && boxCornerEnd.value)) {
      boxCornerStart.value = coords
      boxCornerEnd.value = null
    } else {
      boxCornerEnd.value = coords
    }
    return
  }
  setSelectedLocation(coords)
}

function handleMouseDown(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)
  isDragging.value = true
  if (!canvasRef.value) return
  dragStart.value = { x, y }
}

function handleMouseMove(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)
  if (isDragging.value) {
    // Pan the canvas
    const deltaX = x - dragStart.value.x
    const deltaY = y - dragStart.value.y
    viewX.value -= deltaX
    viewY.value -= deltaY
    dragStart.value = { x, y }
    updateQueryParams()
  }
  if (isBoxSelectionActive.value && boxCornerStart.value && !boxCornerEnd.value) {
    const coords = getCanvasCoordinates(x, y)
    boxHoverCoords.value = coords
  }
}

function handleMouseUp() {
  isDragging.value = false
  initialPinchDistance.value = null
  lastZoom.value = zoom.value
  boxHoverCoords.value = null
}

function setZoom(newZoom: number, centerX: number, centerY: number) {
  const zoomChange = newZoom / zoom.value
  viewX.value = -centerX + (viewX.value + centerX) * zoomChange
  viewY.value = -centerY + (viewY.value + centerY) * zoomChange
  zoom.value = newZoom
  updateQueryParams()
}

function handleWheel(event: WheelEvent) {
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value * zoomFactor))
  // Zoom towards mouse position
  if (!canvasRef.value) return
  const centerX = event.clientX
  const centerY = event.clientY
  setZoom(newZoom, centerX, centerY)
}

function handlePinch(e: TouchEvent) {
  const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
  let currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2
  if (initialPinchDistance.value === null) {
    initialPinchDistance.value = currentDistance
  } else {
    const zoomFactor = currentDistance / initialPinchDistance.value
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastZoom.value * zoomFactor))
    // Zoom towards pinch center
    if (!canvasRef.value) return
    const centerX = (touch1.x + touch2.x) / 2
    const centerY = (touch1.y + touch2.y) / 2
    setZoom(newZoom, centerX, centerY)
  }
}

function resetZoom() {
  setZoom(1, viewportWidth.value / 2, viewportHeight.value / 2)
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    handleMouseDown(e)
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 1) {
    handleMouseMove(e)
  } else if (e.touches.length === 2) {
    isDragging.value = false
    handlePinch(e)
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.touches.length === 1) {
    handleMouseUp()
  }
}

// Animation loop
let animationFrame: number

function animate() {
  renderCanvas()
  animationFrame = requestAnimationFrame(animate)
}

// Lifecycle
onMounted(() => {
  ctx.value = canvasRef.value!.getContext('2d')
  animate()
  function resize() {
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
    nextTick(() => (ctx.value!.imageSmoothingEnabled = false))
  }
  window.addEventListener('resize', resize)
  resize()

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    window.removeEventListener('resize', resize)
  })
})

watch(
  () => props.canvasId,
  async () => {
    await unsubscribeFromCanvas()
    chunks.clear()
    subscribeToCanvas(props.canvasId)
    selectedLocation.value = null
    isEditorOpen.value = false
    editorLocation.value = null
    editorLocationTaken.value = false
    isBoxSelectionActive.value = false
    clearBoxSelection()
  },
  { immediate: true },
)
watch(
  () => props,
  ({ x, y, z, selected }) => {
    setLocation(x, y, z)
    if (selected) setSelectedLocation({ x, y })
  },
  { deep: true, immediate: true },
)
</script>
