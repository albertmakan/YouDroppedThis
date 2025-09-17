<template>
  <div class="w-full h-screen overflow-hidden">
    <!-- Controls
     <div class="controls">
      <div class="user-info">
        <span class="balance">Balance: {{ user?.balance }} coins</span>
        <span class="artworks-count"
          >{{ canvasStore.activeArtworks.length }} artworks on canvas</span
        >
      </div>

      <div class="actions">
        <button
          @click="enterPlacementMode"
          :disabled="placementMode || (user?.balance || 0) < -10"
          class="btn btn-place"
        >
          {{ placementMode ? 'Click to Place' : 'Place Art (10 coins)' }}
        </button>
        <button class="zoom-info" @click="resetZoom">Zoom: {{ Math.round(zoom * 100) }}%</button>
      </div>
    </div>

     Instructions
    <div class="instructions">
      <p v-if="!authToken" class="warning">⚠️ Please log in to place and collect artwork</p>
      <p v-else-if="placementMode" class="active">🎨 Click anywhere to place your artwork</p>
      <p v-else>
        🖱️ <strong>Drag</strong> to pan • <strong>Scroll</strong> to zoom •
        <strong>Ctrl+Click</strong> to collect
      </p>
    </div> -->

    <div
      class="fixed top-0 left-0 rounded-br-md backdrop-blur-xl text-neutral-200 bg-black/50 p-2 font-bold"
    >
      YouDroppedThis
    </div>

    <div class="fixed top-0 right-0 p-2 z-10">
      <ProfileButton />
    </div>

    <div class="fixed bottom-0 left-0 p-2">
      <div class="text-xs font-mono backdrop-blur-xl text-neutral-200 bg-black/50 p-1 rounded-md">
        <div>Canvas coords: ({{ Math.round(viewX) }}, {{ Math.round(viewY) }})</div>
        <div>Visible artworks: {{ canvasStore.activeArtworks.length }}</div>
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
        :disabled="(user?.balance || 0) < -10"
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
              height: 64,
              width: 64,
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

    <!-- Canvas -->
    <canvas
      ref="canvasRef"
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
      class=""
      :class="{
        'cursor-grabbing': isDragging,
        'cursor-crosshair': placementMode,
        'cursor-grab': !placementMode,
      }"
    ></canvas>

    <div
      v-if="placementPreview"
      class="fixed pointer-events-none border-2 border-current border-dashed text-neutral-200"
      :style="{
        left: `${placementPreview.x}px`,
        top: `${placementPreview.y}px`,
        width: `${ART_SIZE * zoom}px`,
        height: `${ART_SIZE * zoom}px`,
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
            <TimeRemainingIcon :remaining="placementPreview.t <= 0 ? 0 : placementPreview.t" />
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
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

const canvasStore = useCanvasStore()
const authStore = useAuthStore()
const editorStore = useEditorStore()

// Canvas refs and state
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// Canvas properties
const CANVAS_SIZE = 1024
const ART_SIZE = 64
const VIEWPORT_WIDTH = 2048
const VIEWPORT_HEIGHT = 1024

// View state
const viewX = ref(0)
const viewY = ref(0)
const zoom = ref(1)
const lastZoom = ref(1)
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
  return {
    x: selectedArtwork.value.x * zoom.value - viewX.value,
    y: selectedArtwork.value.y * zoom.value - viewY.value,
    t:
      (new Date(selectedArtwork.value.expires_at).getTime() - Date.now()) /
      (new Date(selectedArtwork.value.expires_at).getTime() -
        new Date(selectedArtwork.value.created_at).getTime()),
  }
})

// User state
const { user, token: authToken } = authStore /// fix when login

// Computed properties
// computed(() => {
//   // Only render artworks visible in current viewport
//   const margin = 100 // Extra margin for smooth scrolling
//   const left = viewX.value / zoom.value - margin
//   const top = viewY.value / zoom.value - margin
//   const right = left + VIEWPORT_WIDTH / zoom.value + margin * 2
//   const bottom = top + VIEWPORT_HEIGHT / zoom.value + margin * 2

//   return artworks.filter(
//     (art) => art.x < right && art.x + ART_SIZE > left && art.y < bottom && art.y + ART_SIZE > top,
//   )
// })

// Canvas utilities
function getCanvasCoordinates(clientX: number, clientY: number) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (clientX - rect.left + viewX.value) / zoom.value
  const y = (clientY - rect.top + viewY.value) / zoom.value
  return { x, y }
}

function snapToGrid(x: number, y: number) {
  return {
    x: Math.floor(x / ART_SIZE) * ART_SIZE,
    y: Math.floor(y / ART_SIZE) * ART_SIZE,
  }
}

function resetZoom() {
  zoom.value = 1
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
  if (!authToken) {
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
  if (!authToken) {
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
  canvas.width = VIEWPORT_WIDTH
  canvas.height = VIEWPORT_HEIGHT

  // Clear canvas
  ctx.value.fillStyle = 'oklch(12.9% 0.042 264.695)'
  ctx.value.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

  // Draw grid (optional, for development)
  // ctx.value.strokeStyle = '#e0e0e0'
  // ctx.value.lineWidth = 0.5

  // const gridSize = ART_SIZE * zoom.value
  // const offsetX = -viewX.value % gridSize
  // const offsetY = -viewY.value % gridSize

  // if (zoom.value > 0.5) {
  //   // Only show grid when zoomed in enough
  //   for (let x = offsetX; x < VIEWPORT_WIDTH; x += gridSize) {
  //     ctx.value.beginPath()
  //     ctx.value.moveTo(x, 0)
  //     ctx.value.lineTo(x, VIEWPORT_HEIGHT)
  //     ctx.value.stroke()
  //   }

  //   for (let y = offsetY; y < VIEWPORT_HEIGHT; y += gridSize) {
  //     ctx.value.beginPath()
  //     ctx.value.moveTo(0, y)
  //     ctx.value.lineTo(VIEWPORT_WIDTH, y)
  //     ctx.value.stroke()
  //   }
  // }
  const context = ctx.value

  // Draw artworks
  canvasStore.activeArtworks.forEach((artwork, i) => {
    const x = artwork.x * zoom.value - viewX.value
    const y = artwork.y * zoom.value - viewY.value
    const size = ART_SIZE * zoom.value
    const pixelSize = size / artwork.resolution

    artwork.pixels ||= artwork.pixel_data.startsWith('[[')
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

    // Draw timer indicator
    if (artwork.time_remaining) {
      const progress = artwork.time_remaining / (24 * 60 * 60 * 1000) // 24 hours
      context.fillStyle = `rgba(255, 0, 0, ${1 - progress})`
      context.fillRect(x, y - 4, size * progress, 2)
    }
  })

  // Draw placement preview
  if (placementMode.value && selectedArt.value) {
    const x = selectedArt.value.x * zoom.value - viewX.value
    const y = selectedArt.value.y * zoom.value - viewY.value
    const size = ART_SIZE * zoom.value

    ctx.value.strokeStyle = '#ffffff'
    ctx.value.lineWidth = 2
    ctx.value.setLineDash([5, 5])
    ctx.value.strokeRect(x, y, size, size)
    ctx.value.setLineDash([])
  }
}

function handleContextMenu(event: MouseEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)
  const clickedArtwork = canvasStore.activeArtworks.find(
    (art) =>
      coords.x >= art.x &&
      coords.x < art.x + ART_SIZE &&
      coords.y >= art.y &&
      coords.y < art.y + ART_SIZE,
  )

  if (clickedArtwork) {
    if (selectedArtwork.value === clickedArtwork) selectedArtwork.value = null
    else selectedArtwork.value = clickedArtwork
  }
}

function handleClick(event: MouseEvent | TouchEvent) {
  const { x, y } = getEventLocation(event)
  const coords = getCanvasCoordinates(x, y)

  if (placementMode.value) {
    // Place artwork mode
    const snapped = snapToGrid(coords.x, coords.y)

    if (
      snapped.x >= 0 &&
      snapped.y >= 0 &&
      snapped.x + ART_SIZE <= CANVAS_SIZE &&
      snapped.y + ART_SIZE <= CANVAS_SIZE
    ) {
      // Check if position is occupied
      const occupied = canvasStore.activeArtworks.some(
        (art) => art.x === snapped.x && art.y === snapped.y,
      )

      if (!occupied) {
        openEditor(snapped.x, snapped.y)
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
    const snapped = snapToGrid(coords.x, coords.y)
    selectedArt.value = snapped
  }
}

function handleMouseUp() {
  isDragging.value = false
  initialPinchDistance.value = null
  lastZoom.value = zoom.value
}

function handleWheel(event: WheelEvent) {
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(0.1, Math.min(10, zoom.value * zoomFactor))

  // Zoom towards mouse position
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const zoomChange = newZoom / zoom.value
  viewX.value = -mouseX + (viewX.value + mouseX) * zoomChange
  viewY.value = -mouseY + (viewY.value + mouseY) * zoomChange

  zoom.value = newZoom
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
    const newZoom = Math.max(0.1, Math.min(10, lastZoom.value * zoomFactor))
    // Zoom towards mouse position
    if (!canvasRef.value) return
    const mouseX = (touch1.x + touch2.x) / 2
    const mouseY = (touch1.y + touch2.y) / 2

    const zoomChange = newZoom / zoom.value
    viewX.value = -mouseX + (viewX.value + mouseX) * zoomChange
    viewY.value = -mouseY + (viewY.value + mouseY) * zoomChange

    zoom.value = newZoom
  }
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
  if ((user?.balance || 0) < -10) {
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
  canvasStore.loadCanvasState() //fetchCanvas()
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    animate()
  }

  // Refresh canvas data periodically
  // const interval = setInterval(fetchCanvas, 10000) // Every 10 seconds

  onUnmounted(() => {
    // clearInterval(interval)
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })
})
</script>
