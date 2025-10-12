<template>
  <div class="w-full h-screen overflow-hidden">
    <div
      class="fixed top-0 left-0 rounded-br-md backdrop-blur-xl text-primary bg-black/50 p-2 z-10 font-bold"
    >
      YouDroppedThis
    </div>

    <div class="fixed top-0 right-0 p-2 z-20">
      <ProfileButton />
    </div>

    <div class="fixed bottom-0 left-0 p-2 z-10 font-mono">
      <div
        v-if="showInfo"
        class="text-xs backdrop-blur-xl text-neutral-200 bg-black/50 p-1 rounded-md"
      >
        <div>
          Canvas coords: ({{ Math.floor(viewX / zoomedArtSize) }},
          {{ Math.floor(viewY / zoomedArtSize) }})
        </div>
        <div>
          W: {{ (viewportWidth / zoomedArtSize).toFixed(1) }}, H:
          {{ (viewportHeight / zoomedArtSize).toFixed(1) }}
        </div>
        <div>Visible artworks: {{ visibleArtworks }}</div>
        <div>Chunks: {{ (chunks.cx2 - chunks.cx1 + 1) * (chunks.cy2 - chunks.cy1 + 1) }}</div>
        <div>
          Zoom: {{ Math.round(zoom * 100) }}%
          <button @click="resetZoom" class="cursor-pointer hover:underline">Reset</button>
        </div>
      </div>
      <button
        @click="showInfo = !showInfo"
        class="rounded-full border border-current size-6 backdrop-blur-xl text-neutral-200 bg-black/50 cursor-pointer"
      >
        i
      </button>
    </div>

    <div v-if="authStore.isAuthenticated" class="fixed bottom-0 right-0 p-2 z-20">
      <button
        v-if="
          (!editorStore.isOpen || !editorRelativeLocation || editorLocationTaken) &&
          editorStore.location
        "
        @click="reopenEditor"
        class="group relative size-16 hover:scale-110 rounded-md border-2 border-dashed border-neutral-200 cursor-pointer"
      >
        <ArtworkThumbnail
          :artwork="{
            pixels: editorStore.pixels,
            resolution: editorStore.resolution as any,
            created_at: '',
            expires_at: '',
            id: 0,
            is_expired: false,
            pixel_data: '',
            user_id: 0,
            ...editorStore.location,
          }"
        />
        <template v-if="editorLocationTaken">
          <div class="absolute -top-2 -left-2 rounded-full bg-code-warn size-4" />
          <div
            class="absolute bottom-full mb-2 -left-1/2 group-focus:block hidden text-xs font-mono p-1 backdrop-blur-xl bg-black/50 text-code-warn rounded-md"
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
      @wheel.passive="handleWheel"
      @touchstart.passive="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @contextmenu.prevent="handleContextMenu"
      @click.prevent
      @dblclick.prevent
      @keydown="handleArrows"
      tabindex="0"
      :class="{ 'cursor-grabbing': isDragging, 'cursor-grab': !isDragging }"
    />
    <div
      v-if="locationPreview && !selectedLocation?.artwork"
      class="fixed pointer-events-none border-2 border-current border-dashed text-neutral-200"
      :style="{
        left: `${locationPreview.x}px`,
        top: `${locationPreview.y}px`,
        width: `${zoomedArtSize}px`,
        height: `${zoomedArtSize}px`,
      }"
    >
      <button @click="openEditorAtNewLocation" class="pointer-events-auto cursor-pointer size-1/2">
        <DrawIcon />
      </button>
    </div>
    <ArtworkInfoPopup
      v-if="locationPreview && selectedLocation?.artwork"
      :artwork="selectedLocation.artwork"
      :top="locationPreview.y"
      :left="locationPreview.x"
      :size="zoomedArtSize"
    />
    <PixelArtEditorPopup
      v-if="editorStore.isOpen && editorRelativeLocation && !editorLocationTaken"
      @close="editorStore.isOpen = false"
      @done="placeArtwork"
      :top="editorRelativeLocation.y"
      :left="editorRelativeLocation.x"
      :size="zoomedArtSize"
      @wheel="handleWheel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  ART_SIZE,
  CANVAS_SIZE,
  CHUNK_SIZE,
  MAX_ZOOM,
  MIN_ZOOM,
  useCanvasStore,
} from '@/stores/canvas'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { artworkApi } from '@/services/api'
import type { Artwork } from '@/shared/types'
import ProfileButton from '@/components/User/ProfileButton.vue'
import PixelArtEditorPopup from '@/components/Editor/PixelArtEditorPopup.vue'
import PlusIcon from '@/components/Icons/PlusIcon.vue'
import ArtworkThumbnail from '@/components/Artwork/ArtworkThumbnail.vue'
import { useRoute } from 'vue-router'
import { updateEffect, updateParticles } from '@/utils/physics'
import { renderArtwork, renderParticles } from '../Artwork/renderArtwork'
import ArtworkInfoPopup from '../Artwork/ArtworkInfoPopup.vue'
import DrawIcon from '../Icons/DrawIcon.vue'

const canvasStore = useCanvasStore()
const authStore = useAuthStore()
const editorStore = useEditorStore()
const route = useRoute()

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
const zoomedArtSize = computed(() => ART_SIZE * zoom.value)
const zoomedChunkSize = computed(() => zoomedArtSize.value * CHUNK_SIZE)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const initialPinchDistance = ref<number | null>(null)
const showInfo = ref(false)
const editorLocationTaken = ref(false)

// Selection state
const selectedLocation = ref<{ x: number; y: number; artwork: Artwork | null } | null>(null)
const locationPreview = computed(
  () => selectedLocation.value && getArtworkRelativeCoordinates(selectedLocation.value),
)
const editorRelativeLocation = computed(() => {
  const rl =
    editorStore.location &&
    (isOutsideViewport(editorStore.location.x, editorStore.location.y)
      ? null
      : getArtworkRelativeCoordinates(editorStore.location))
  return rl
})

watch(
  () => route.query,
  ({ x, y }) => setLocation(+(x ?? 0), +(y ?? 0)),
  { deep: true },
)

const chunks = computed(() => {
  const cx1 = Math.max(Math.floor(viewX.value / zoomedChunkSize.value), 0)
  const cx2 = Math.min(
    Math.floor((viewX.value + viewportWidth.value) / zoomedChunkSize.value),
    CANVAS_SIZE / CHUNK_SIZE,
  )
  const cy1 = Math.max(Math.floor(viewY.value / zoomedChunkSize.value), 0)
  const cy2 = Math.min(
    Math.floor((viewY.value + viewportHeight.value) / zoomedChunkSize.value),
    CANVAS_SIZE / CHUNK_SIZE,
  )
  for (let cx = cx1; cx <= cx2; cx++) {
    for (let cy = cy1; cy <= cy2; cy++) {
      const chunk = canvasStore.canvasChunks[cy]?.[cx]
      if (!chunk?.arts && !chunk?.isLoading) {
        canvasStore.loadChunk(cx, cy, zoom.value)
      }
    }
  }
  return { cx1, cx2, cy1, cy2 }
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

function setLocation(x: number, y: number, center = false) {
  viewX.value =
    x * zoomedArtSize.value - (center ? (viewportWidth.value - zoomedArtSize.value) / 2 : 0)
  viewY.value =
    y * zoomedArtSize.value - (center ? (viewportHeight.value - zoomedArtSize.value) / 2 : 0)
}

function getEventLocation(e: MouseEvent | TouchEvent) {
  if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

function isOutsideViewport(x: number, y: number) {
  return (
    x < Math.floor(viewX.value / zoomedArtSize.value) ||
    x > Math.floor((viewX.value + viewportWidth.value) / zoomedArtSize.value) ||
    y < Math.floor(viewY.value / zoomedArtSize.value) ||
    y > Math.floor((viewY.value + viewportHeight.value) / zoomedArtSize.value)
  )
}

function reopenEditor() {
  if (!editorStore.location) {
    return
  }
  editorStore.isOpen = true
  const { x, y } = editorStore.location
  if (isOutsideViewport(x, y)) setLocation(x, y, true)
}

function openEditorAtNewLocation() {
  if (!selectedLocation.value || selectedLocation.value.artwork) return
  editorStore.location = selectedLocation.value
  editorLocationTaken.value = false
  editorStore.isOpen = true
  selectedLocation.value = null
}

async function placeArtwork() {
  if (!authStore.token) {
    alert('Please log in to place artwork')
    return
  }
  if (!editorStore.location) {
    return
  }
  try {
    const response = await artworkApi.placeArtwork({
      pixel_data: editorStore.getPixelData(),
      resolution: editorStore.resolution,
      ...editorStore.location,
    })
    editorStore.isOpen = false
    editorStore.location = null
    editorStore.clearCanvas()
    if (response) {
      console.log('Artwork placed successfully!')
    } else {
      alert('Failed to place artwork')
    }
  } catch (error) {
    console.error('Failed to place artwork:', error)
  }
}

// Canvas rendering
let visibleArtworks = 0
function renderCanvas() {
  if (!ctx.value || !canvasRef.value) return
  const canvas = canvasRef.value
  const context = ctx.value

  // Clear canvas
  context.fillStyle = 'oklch(27.7% 0.046 192.524)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Draw grid
  if (zoom.value > 0.5) {
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    const gridSize = zoomedArtSize.value
    const offsetX = -viewX.value % gridSize
    const offsetY = -viewY.value % gridSize
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        context.beginPath()
        context.moveTo(x - 1, y)
        context.lineTo(x + 1, y)
        context.stroke()
      }
    }
  }

  // Draw artworks
  visibleArtworks = 0
  const { cx1, cx2, cy1, cy2 } = chunks.value
  for (let cx = cx1; cx <= cx2; cx++) {
    for (let cy = cy1; cy <= cy2; cy++) {
      const chunk = canvasStore.canvasChunks[cy]?.[cx]
      if (chunk?.isLoading) {
        context.fillStyle = 'rgb(255,255,255,0.4)'
        const x = cx * zoomedChunkSize.value - viewX.value
        const y = cy * zoomedChunkSize.value - viewY.value
        context.fillRect(x, y, zoomedChunkSize.value, zoomedChunkSize.value)
      } else {
        chunk?.arts?.forEach(
          (artwork) => (visibleArtworks += drawArtwork(artwork, context) ? 1 : 0),
        )
      }
    }
  }
  if (
    selectedLocation.value?.artwork?.is_expired ||
    selectedLocation.value?.artwork?.collected_by
  ) {
    selectedLocation.value.artwork = null
  }
}

function drawArtwork(artwork: Artwork, context: CanvasRenderingContext2D) {
  if (isOutsideViewport(artwork.x, artwork.y)) {
    return false
  }
  const { x, y } = getArtworkRelativeCoordinates(artwork)
  const resolution = artwork.resolution
  const pixelSize = zoomedArtSize.value / resolution

  if (artwork.is_expired) {
    if (!artwork.particles?.length) return false
    artwork.particles = updateParticles(artwork.particles, Date.now())
    renderParticles(artwork.particles ?? [], context, x, y, pixelSize)
    return true
  }
  if (artwork.collected_by) {
    if (!artwork.collectionEffect) return false
    artwork.collectionEffect = updateEffect(artwork.collectionEffect, Date.now()) || undefined
    const remaining = (1 - (artwork.collectionEffect?.progress ?? 1)) * resolution
    renderArtwork(artwork.pixels ?? [], context, x, y, resolution, remaining, pixelSize)
    return true
  }
  renderArtwork(artwork.pixels ?? [], context, x, y, resolution, resolution, pixelSize)
  return true
}

// Event handlers
function handleContextMenu(event: MouseEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)
  if (coords.x < 0 || coords.x >= CANVAS_SIZE || coords.y < 0 || coords.y >= CANVAS_SIZE) {
    return
  }
  const clickedArtwork = canvasStore.getArtworkAt(coords.x, coords.y)
  if (clickedArtwork === undefined) {
    return
  }
  selectedLocation.value = { ...coords, artwork: clickedArtwork }
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

    // out-of-bounds color

    dragStart.value = { x, y }
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
  e.preventDefault()

  let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

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

function handleArrows(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    viewY.value -= zoomedArtSize.value
  } else if (event.key === 'ArrowDown') {
    viewY.value += zoomedArtSize.value
  } else if (event.key === 'ArrowLeft') {
    viewX.value -= zoomedArtSize.value
  } else if (event.key === 'ArrowRight') {
    viewX.value += zoomedArtSize.value
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
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    animate()
  }
  function resize() {
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()
  const { x, y } = route.query
  setLocation(+(x ?? 0), +(y ?? 0))

  canvasStore.callbacks.onArtworkPlaced = (artwork) => {
    if (editorStore.location?.x === artwork.x && editorStore.location.y === artwork.y) {
      editorLocationTaken.value = true
    }
  }

  onUnmounted(() => {
    canvasStore.callbacks.onArtworkPlaced = undefined
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    window.removeEventListener('resize', resize)
  })
})
</script>
