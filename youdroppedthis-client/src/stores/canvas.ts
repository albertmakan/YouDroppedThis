import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Artwork, WebSocketMessage } from '@/shared/types'
import { canvasApi, parsePixelData } from '@/services/api'
import { useWebSocket } from '@/services/websocket'

export const CANVAS_SIZE = 1024
export const CHUNK_SIZE = 16
export const ART_SIZE = 64
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 10

export const useCanvasStore = defineStore('canvas', () => {
  const canvasChunks = shallowRef<{ arts?: Artwork[]; isLoading: boolean }[][]>([])

  const callbacks = ref<{
    onArtworkPlaced?: (artwork: Artwork) => void
  }>({})

  const { connect, disconnect, send } = useWebSocket()

  async function loadChunk(cx: number, cy: number, zoom: number) {
    if (!canvasChunks.value[cy]) canvasChunks.value[cy] = []
    canvasChunks.value[cy][cx] = { isLoading: true }
    try {
      const response = await canvasApi.getArtworksInArea(
        cx * CHUNK_SIZE,
        (cx + 1) * CHUNK_SIZE,
        cy * CHUNK_SIZE,
        (cy + 1) * CHUNK_SIZE,
      )
      canvasChunks.value[cy][cx] = { arts: response.artworks, isLoading: false }
    } catch (error) {
      console.error('Failed to load chunk:', error)
    }
  }

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log(message)
    switch (message.type) {
      case 'artwork_placed': {
        const artwork = message.data
        artwork.pixels = parsePixelData(artwork.pixel_data)
        const cx = Math.floor(artwork.x / CHUNK_SIZE)
        const cy = Math.floor(artwork.y / CHUNK_SIZE)
        canvasChunks.value[cy]?.[cx]?.arts?.push(artwork)
        callbacks.value.onArtworkPlaced?.(artwork)
        break
      }
      case 'artwork_collected': {
        const { x, y, id } = message.data.collected
        const cx = Math.floor(x / CHUNK_SIZE)
        const cy = Math.floor(y / CHUNK_SIZE)
        const collected = canvasChunks.value[cy]?.[cx]?.arts?.find((a) => a.id === id)
        if (collected) {
          collected.collected_by = message.data.collectorId
          collected.collected_at = new Date().toISOString()
          collected.collectionEffect = { progress: 0 }
        }
        break
      }
      case 'artwork_expired': {
        message.data.expired.forEach(({ x, y, id }) => {
          const cx = Math.floor(x / CHUNK_SIZE)
          const cy = Math.floor(y / CHUNK_SIZE)
          const expired = canvasChunks.value[cy]?.[cx]?.arts?.find((a) => a.id === id)
          if (expired) {
            expired.is_expired = true
            expired.particles = initializeDisintegrationParticles(expired)
          }
        })
        break
      }
    }
  }

  function getArtworkAt(x: number, y: number) {
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const artworksInChunk = canvasChunks.value[cy]?.[cx]?.arts
    if (!artworksInChunk) return
    return (
      artworksInChunk.find((a) => x === a.x && y === a.y && !a.is_expired && !a.collected_by) ||
      null
    )
  }

  function startWebSocketConnection() {
    connect(handleWebSocketMessage)
  }

  function stopWebSocketConnection() {
    disconnect()
  }

  return {
    canvasChunks,
    loadChunk,
    getArtworkAt,
    startWebSocketConnection,
    stopWebSocketConnection,
    callbacks,
  }
})

function initializeDisintegrationParticles(artwork: Artwork) {
  const particles = []
  for (let pixelY = 0; pixelY < artwork.resolution; pixelY++) {
    for (let pixelX = 0; pixelX < artwork.resolution; pixelX++) {
      const color = artwork.pixels?.[pixelY]?.[pixelX]
      if (!color) continue
      const spreadAngle = Math.random() * Math.PI * 2
      const spreadSpeed = Math.random()
      particles.push({
        x: pixelX,
        y: pixelY,
        color,
        vx: Math.cos(spreadAngle) * spreadSpeed,
        vy: Math.sin(spreadAngle) * spreadSpeed - 0.5, // Slight upward bias
        life: 1.0,
        size: 1,
      })
    }
  }
  return particles
}
