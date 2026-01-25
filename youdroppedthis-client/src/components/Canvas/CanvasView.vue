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
        <div>⚡ Performance: {{ Math.floor(fps) }}fps</div>
        <div>🔌 Realtime: {{ realtimeSubscribeState }}</div>
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
    </div>

    <div v-if="authStore.isAuthenticated" class="fixed bottom-0 right-0 p-2 z-20">
      <button
        v-if="
          (!editorStore.isOpen || !editorRelativeLocation || editorLocationTaken) &&
          editorStore.location
        "
        @click="reopenEditor"
        class="group relative size-16 hover:scale-110 rounded-md border-2 border-dashed border-neutral-400 cursor-pointer"
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
      <button
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
    />
    <PixelArtEditorPopup
      v-if="canvasInfo && editorStore.isOpen && editorRelativeLocation && !editorLocationTaken"
      @close="editorStore.isOpen = false"
      @done="placeArtwork"
      :top="editorRelativeLocation.y"
      :left="editorRelativeLocation.x"
      :size="zoomedArtSize"
      :canvasInfo
      :gridColor
      @wheel="handleWheel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, toRef } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import type { Artwork } from '@/shared/types'
import { useCanvas } from '@/composables/useCanvases'
import { useCollectArtwork, usePlaceArtwork } from '@/composables/useUserArtworks'
import { useToast } from '@/composables/useToast'
import PixelArtEditorPopup from '@/components/Editor/PixelArtEditorPopup.vue'
import ArtworkThumbnail from '@/components/Artwork/ArtworkThumbnail.vue'
import { createOffscreenCanvas, renderParticles } from '@/components/Artwork/renderArtwork'
import ArtworkInfoPopup from '@/components/Artwork/ArtworkInfoPopup.vue'
import DrawIcon from '@/assets/icons/draw.svg'
import XMarkIcon from '@/assets/icons/xmark.svg'
import { initializeDisintegrationParticles, updateEffect, updateParticles } from '@/utils/physics'
import f from '@/utils/builtInFunctions'
import { colorToRGBA, rgbToHSL } from '@/utils/color'
import { canvasApi } from '@/services/api'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/realtime-js'

const CHUNK_SIZE = 16
const MIN_ZOOM = 0.25
const MAX_ZOOM = 5
const DEFAULT_BACKGROUND = '#18181b'

const props = defineProps<{
  canvasId: number
  x: number
  y: number
  z?: number
  selected?: boolean
}>()

const canvasId = toRef(props, 'canvasId')
const { data: canvasInfo, isError, error } = useCanvas(canvasId)
const { mutate: mutatePlaceArtwork } = usePlaceArtwork(canvasId)
const { mutate: mutateCollectArtwork } = useCollectArtwork(canvasId)

const toast = useToast()

const authStore = useAuthStore()
const editorStore = useEditorStore()
const router = useRouter()

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

const viewBounds = computed(() => ({
  x1: Math.floor(viewX.value / zoomedArtSize.value),
  x2: Math.floor((viewX.value + viewportWidth.value) / zoomedArtSize.value),
  y1: Math.floor(viewY.value / zoomedArtSize.value),
  y2: Math.floor((viewY.value + viewportHeight.value) / zoomedArtSize.value),
}))

const canvasBounds = computed(() => {
  const { min_x = -8, max_x = 7, min_y = -8, max_y = 7 } = canvasInfo.value ?? {}
  return { min_x, max_x, min_y, max_y }
})

const chunks = new Map<string, { artworks?: Artwork[]; isLoading: boolean }>()
const subscription = ref<RealtimeChannel | null>(null)
const realtimeSubscribeState = ref('')

function subscribeToCanvas(canvasId: number) {
  const channel = supabase.channel(`canvas:${canvasId}`, { config: { private: true } })
  channel
    .on('broadcast', { event: '*' }, ({ payload, event }) => handleRealtimeEvent(event, payload))
    .subscribe((state) => (realtimeSubscribeState.value = state))
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
    if (editorStore.location?.x === artwork.x && editorStore.location.y === artwork.y) {
      editorLocationTaken.value = true
    }
  } else if (event === 'collected') {
    const { x, y, id, collected_at, collected_by } = payload as Artwork
    const collected = getChunkByCoords(x, y)?.artworks?.find((a) => a.id === id)
    if (collected) {
      collected.collected_by = collected_by
      collected.collected_at = collected_at
      collected.collectionEffect = { progress: 0 }
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
    editorStore.location &&
    (isOutsideViewport(editorStore.location.x, editorStore.location.y)
      ? null
      : getArtworkRelativeCoordinates(editorStore.location)),
)

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
  const [r, g, b] = colorToRGBA(canvasInfo.value?.background_color || DEFAULT_BACKGROUND)
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

function reopenEditor() {
  if (!editorStore.location) {
    return
  }
  editorStore.isOpen = true
  const { x, y } = editorStore.location
  if (isOutsideViewport(x, y)) {
    setLocation(x, y)
    updateQueryParams()
  }
}

function openEditorAtNewLocation() {
  if (!selectedLocation.value || selectedLocation.value.artwork) return
  editorStore.location = selectedLocation.value
  editorLocationTaken.value = false
  editorStore.isOpen = true
  selectedLocation.value = null
}

async function placeArtwork() {
  if (!editorStore.location) {
    return
  }
  if (!authStore.user) {
    toast.warning('Please log in to place artwork')
    return
  } else if (!authStore.user.confirmed_at) {
    toast.warning('Please confirm your account to place artwork')
    return
  }
  editorStore.isPlacing = true
  mutatePlaceArtwork(
    {
      pixelData: editorStore.getPixelData(),
      ...editorStore.location,
    },
    {
      onSuccess: (response) => {
        editorStore.isOpen = false
        editorStore.location = null
        editorStore.isPlacing = false
        editorStore.clearCanvas()
        authStore.setProfileInfo(response.userProfile)
      },
      onError: (error) => {
        toast.error(
          'Failed to place artwork: ' +
            JSON.stringify((error as AxiosError).response?.data, null, 4),
        )
        editorStore.isPlacing = false
      },
    },
  )
}

async function collectArtwork() {
  if (!selectedLocation.value?.artwork) {
    return
  }
  if (!authStore.user) {
    toast.warning('Please log in to collect artwork')
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
  context.fillStyle = canvasInfo.value?.background_color || DEFAULT_BACKGROUND
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

  let now = ''
  if (renderCount % 100 === 0) {
    now = new Date().toISOString()
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
          visibleArtworks += drawArtwork(artwork, context, now)
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
}

function handleMouseUp() {
  isDragging.value = false
  initialPinchDistance.value = null
  lastZoom.value = zoom.value
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
let lastFrameTime: number | undefined = undefined
let fps = 1

function animate(timestamp?: number) {
  if (!lastFrameTime || !timestamp) {
    lastFrameTime = timestamp
  } else {
    const dt = (timestamp - lastFrameTime) / 1000
    lastFrameTime = timestamp
    fps = 1 / dt
  }
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
    editorStore.isOpen = false
    editorStore.location = null
    editorLocationTaken.value = false
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
