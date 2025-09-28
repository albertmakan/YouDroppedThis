<template>
  <div class="w-full h-screen overflow-hidden">
    <div
      class="fixed top-0 left-0 rounded-br-md backdrop-blur-xl text-[#14B8A6] bg-black/50 p-2 z-10 font-bold"
    >
      YouDroppedThis
    </div>

    <div class="fixed top-0 right-0 p-2 z-10">
      <ProfileButton />
    </div>

    <div class="fixed bottom-0 left-0 p-2 z-10">
      <div class="text-xs font-mono backdrop-blur-xl text-neutral-200 bg-black/50 p-1 rounded-md">
        <div>
          Canvas coords: ({{ Math.floor(viewX / zoomedArtSize) }},
          {{ Math.floor(viewY / zoomedArtSize) }})
        </div>
        <div>
          W: {{ (viewportWidth / zoomedArtSize).toFixed(1) }}, H:
          {{ (viewportHeight / zoomedArtSize).toFixed(1) }}
        </div>
        <div>Visible artworks: //todo</div>
        <div>Chunks: {{ (chunks.cx2 - chunks.cx1 + 1) * (chunks.cy2 - chunks.cy1 + 1) }}</div>
      </div>
      <button
        class="rounded-full border border-current size-6 backdrop-blur-xl text-neutral-200 bg-black/50 font-mono"
      >
        i
      </button>
      <button
        class="text-xs backdrop-blur-xl text-neutral-200 font-semibold bg-black/50 rounded-md px-1"
        @click="resetZoom"
      >
        Zoom: {{ Math.round(zoom * 100) }}%
      </button>
    </div>

    <div v-if="authStore.isAuthenticated" class="fixed bottom-0 right-0 p-2 z-20">
      <button
        @click="togglePlacementMode"
        :disabled="(authStore.user?.balance || 0) < -10"
        class="size-10 hover:scale-110 relative rounded-md border-2 border-dashed border-current backdrop-blur-xl text-neutral-200 bg-black/50 cursor-pointer disabled:opacity-50"
        :class="{}"
      >
        <div class="inset-0 absolute opacity-60">
          <ArtworkThumbnail
            v-if="!editorStore.isOpen"
            :artwork="{
              pixels: editorStore.pixels,
              resolution: editorStore.resolution as any,
              created_at: '',
              expires_at: '',
              id: 0,
              is_expired: false,
              pixel_data: '',
              user_id: 0,
              ...selectedLocation,
            }"
          />
        </div>
        <div class="inset-0 absolute">
          <XMarkIcon v-if="placementMode" />
          <PlusIcon v-else />
        </div>
      </button>
      <PixelArtEditorPopup
        v-if="editorStore.isOpen"
        @close="editorStore.closeEditor"
        @success="placeArtwork"
      />
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
      @click="handleClick"
      @dblclick="handleContextMenu"
      :class="{
        'cursor-grabbing': isDragging,
        'cursor-crosshair': placementMode,
        'cursor-grab': !placementMode,
      }"
    />

    <div
      v-if="placementPreview"
      class="fixed pointer-events-none border-2 border-current border-dashed text-neutral-200"
      :style="{
        left: `${placementPreview.x}px`,
        top: `${placementPreview.y}px`,
        width: `${zoomedArtSize}px`,
        height: `${zoomedArtSize}px`,
      }"
    >
      <div class="relative h-full">
        <div
          class="absolute bottom-full min-w-full flex gap-4 justify-between mb-0.5 pointer-events-auto bg-neutral-800/90 backdrop-blur-sm rounded-md rounded-bl-none p-2"
          @touchmove.prevent
        >
          <span class="font-semibold">{{ selectedArtwork?.username }}</span>
          <div
            class="size-5 text-neutral-700"
            :title="'Expires at ' + new Date(selectedArtwork!.expires_at)"
          >
            <TimeRemainingIcon :remaining="Math.max(placementPreview.t, 0)" />
          </div>
        </div>
        <div
          class="absolute top-full min-w-full mt-0.5 bg-neutral-800/90 backdrop-blur-sm rounded-md rounded-tl-none p-1 flex justify-between"
        >
          <button
            @click="collectArtwork"
            @touchmove.prevent
            class="cursor-pointer pointer-events-auto size-8"
            title="Collect"
          >
            <CollectIcon />
          </button>
        </div>
      </div>
    </div>
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
import XMarkIcon from '@/components/Icons/XMarkIcon.vue'
import PlusIcon from '@/components/Icons/PlusIcon.vue'
import ArtworkThumbnail from '@/components/Artwork/ArtworkThumbnail.vue'
import TimeRemainingIcon from '../Icons/TimeRemainingIcon.vue'
import CollectIcon from '../Icons/CollectIcon.vue'
import { useRoute } from 'vue-router'

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
const selectedLocation = ref({ x: 0, y: 0 })
const initialPinchDistance = ref<number | null>(null)

// Art state
const selectedArt = ref<{ x: number; y: number } | null>(null)
const placementMode = ref(false)

const selectedArtwork = ref<Artwork | null>(null)
const placementPreview = computed(() => {
  if (!selectedArtwork.value) return null
  const expirationTime = new Date(selectedArtwork.value.expires_at).getTime()
  return {
    x: selectedArtwork.value.x * zoomedArtSize.value - viewX.value,
    y: selectedArtwork.value.y * zoomedArtSize.value - viewY.value,
    t:
      (expirationTime - Date.now()) /
      (expirationTime - new Date(selectedArtwork.value.created_at).getTime()),
  }
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

function setLocation(x: number, y: number) {
  if (x) {
    viewX.value = x * zoomedArtSize.value
  }
  if (y) {
    viewY.value = y * zoomedArtSize.value
  }
}

function getEventLocation(e: MouseEvent | TouchEvent) {
  if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

async function openEditor(x: number, y: number) {
  selectedLocation.value = { x, y }
  editorStore.openEditor()
}

async function placeArtwork(pixelData: string, resolution: any) {
  if (!authStore.token) {
    alert('Please log in to place artwork')
    return
  }
  try {
    const response = await artworkApi.placeArtwork({
      ...selectedLocation.value,
      pixel_data: pixelData,
      resolution,
    })
    editorStore.closeEditor(true)
    if (response) {
      console.log('Artwork placed successfully!')
    } else {
      alert('Failed to place artwork')
    }
  } catch (error) {
    console.error('Failed to place artwork:', error)
  }
}

async function collectArtwork() {
  if (!authStore.token) {
    alert('Please log in to collect artwork')
    return
  }
  if (!selectedArtwork.value) return
  try {
    const response = await artworkApi.collectArtwork(selectedArtwork.value.id)

    if (response) {
      console.log('Artwork collected!')
      selectedArtwork.value = null
    } else {
      alert('Failed to collect artwork')
    }
  } catch (error) {
    console.error('Failed to collect artwork:', error)
  }
}

// Canvas rendering
function renderCanvas() {
  if (!ctx.value || !canvasRef.value) return
  const canvas = canvasRef.value
  const context = ctx.value

  // Clear canvas
  context.fillStyle = 'oklch(27.7% 0.046 192.524)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Draw grid (optional, for development)
  if (zoom.value > 0.5) {
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    const gridSize = zoomedArtSize.value
    const offsetX = -viewX.value % gridSize
    const offsetY = -viewY.value % gridSize
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        context.beginPath()
        context.moveTo(x, y)
        context.lineTo(x + 2, y)
        context.stroke()
      }
    }
  }

  // Draw artworks
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
        chunk?.arts?.forEach((artwork) => drawArtwork(artwork, context))
      }
    }
  }

  // Draw placement preview
  if (placementMode.value && selectedArt.value) {
    const x = selectedArt.value.x * zoomedArtSize.value - viewX.value
    const y = selectedArt.value.y * zoomedArtSize.value - viewY.value
    const size = zoomedArtSize.value

    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.setLineDash([5, 5])
    context.strokeRect(x, y, size, size)
    context.setLineDash([])
  }
}

function drawArtwork(artwork: Artwork, context: CanvasRenderingContext2D) {
  if (artwork.is_expired || artwork.collected_by) {
    return
  }
  const x = artwork.x * zoomedArtSize.value - viewX.value
  const y = artwork.y * zoomedArtSize.value - viewY.value
  const pixelSize = zoomedArtSize.value / artwork.resolution
  // check if outside view
  artwork.pixels ||= artwork.pixel_data.startsWith('[[') // in api?
    ? JSON.parse(artwork.pixel_data)
    : Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => '#ff0000'))

  for (let pixelY = 0; pixelY < artwork.resolution; pixelY++) {
    for (let pixelX = 0; pixelX < artwork.resolution; pixelX++) {
      context.fillStyle = artwork.pixels![pixelY][pixelX] || 'transparent'
      context.fillRect(
        x + pixelX * pixelSize,
        y + pixelY * pixelSize,
        pixelSize + (pixelX === artwork.resolution - 1 ? 0 : 1),
        pixelSize + (pixelY === artwork.resolution - 1 ? 0 : 1),
      )
    }
  }
}

function handleContextMenu(event: MouseEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)
  const clickedArtwork = canvasStore.getArtworkAt(coords.x, coords.y)

  if (clickedArtwork) {
    if (selectedArtwork.value?.id === clickedArtwork.id) selectedArtwork.value = null
    else selectedArtwork.value = clickedArtwork
  }
}

function handleClick(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)

  if (placementMode.value) {
    if (coords.x >= 0 && coords.y >= 0 && coords.x < CANVAS_SIZE && coords.y < CANVAS_SIZE) {
      const occupied = canvasStore.getArtworkAt(coords.x, coords.y)
      if (!occupied) {
        openEditor(coords.x, coords.y)
      } else {
        alert('Position already occupied!')
      }
    }
    placementMode.value = false
    selectedArt.value = null
  }
}

// Event handlers
function handleMouseDown(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)

  if (!placementMode.value) {
    isDragging.value = true
    if (!canvasRef.value) return
    dragStart.value = { x, y }
  }
}

function handleMouseMove(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)

  if (isDragging.value) {
    // Pan the canvas
    const deltaX = x - dragStart.value.x
    const deltaY = y - dragStart.value.y

    viewX.value -= deltaX
    viewY.value -= deltaY

    // viewX.value = Math.max(
    //   0,
    //   Math.min(CANVAS_SIZE * zoom.value - VIEWPORT_WIDTH, viewX.value - deltaX),
    // )
    // viewY.value = Math.max(
    //   0,
    //   Math.min(CANVAS_SIZE * zoom.value - VIEWPORT_HEIGHT, viewY.value - deltaY),
    // )

    dragStart.value = { x, y }
  } else if (placementMode.value) {
    // Update placement preview
    const coords = getCanvasCoordinates(x, y)
    selectedArt.value = coords
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
  } else if (e.type == 'touchmove' && e.touches.length === 2) {
    isDragging.value = false
    handlePinch(e)
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.touches.length === 1) {
    handleMouseUp()
  } else if (e.type == 'touchmove' && e.touches.length === 2) {
    isDragging.value = false
    handlePinch(e)
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 1) {
    handleMouseMove(e)
  } else if (e.type == 'touchmove' && e.touches.length === 2) {
    isDragging.value = false
    handlePinch(e)
  }
}

// UI actions
function togglePlacementMode() {
  if ((authStore.user?.balance || 0) < -10) {
    alert('Insufficient balance! You need 10 coins to place artwork.')
    return
  }
  placementMode.value = !placementMode.value
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

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    window.removeEventListener('resize', resize)
  })
})
</script>
