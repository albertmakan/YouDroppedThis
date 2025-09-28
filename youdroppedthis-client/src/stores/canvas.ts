import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { Artwork, WebSocketMessage } from '@/shared/types'
import { canvasApi } from '@/services/api'
import { useWebSocket } from '@/services/websocket'

export const CANVAS_SIZE = 1024
export const CHUNK_SIZE = 16
export const ART_SIZE = 64
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 10

export const useCanvasStore = defineStore('canvas', () => {
  const canvasChunks = shallowRef<{ arts?: Artwork[]; isLoading: boolean }[][]>([])

  const { connect, disconnect, send } = useWebSocket()

  async function loadChunk(cx: number, cy: number, zoom: number) {
    if (!canvasChunks.value[cy]) canvasChunks.value[cy] = []
    canvasChunks.value[cy][cx] = { isLoading: true }
    // triggerRef(canvasChunks)
    try {
      const response = await canvasApi.getArtworksInArea(
        cx * CHUNK_SIZE,
        (cx + 1) * CHUNK_SIZE,
        cy * CHUNK_SIZE,
        (cy + 1) * CHUNK_SIZE,
      )
      canvasChunks.value[cy][cx] = { arts: response.artworks, isLoading: false }
      // triggerRef(canvasChunks)
    } catch (error) {
      console.error('Failed to load chunk:', error)
    }
  }

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log(message)
    switch (message.type) {
      case 'artwork_placed': {
        const artwork = message.data
        const cx = Math.floor(artwork.x / CHUNK_SIZE)
        const cy = Math.floor(artwork.y / CHUNK_SIZE)
        canvasChunks.value[cy]?.[cx]?.arts?.push(artwork)
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
          }
        })
        break
      }
    }
  }

  function getArtworkAt(x: number, y: number) {
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    return (
      canvasChunks.value[cy]?.[cx]?.arts?.find((artwork) => x === artwork.x && y === artwork.y) ||
      null
    )
  }

  function startWebSocketConnection() {
    connect('ws://192.168.0.106:8000/ws', handleWebSocketMessage)
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
  }
})
