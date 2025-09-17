import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Artwork, CanvasState, WebSocketMessage } from '@/shared/types'
import { canvasApi } from '@/services/api'
import { useWebSocket } from '@/services/websocket'

export const useCanvasStore = defineStore('canvas', () => {
  const artworks = ref<Artwork[]>([])
  const bounds = ref({ minX: 0, maxX: 0, minY: 0, maxY: 0 })
  const isLoading = ref(false)
  const selectedArtwork = ref<Artwork | null>(null)

  const { connect, disconnect, send } = useWebSocket()

  const activeArtworks = computed(() =>
    artworks.value.filter((artwork) => !artwork.is_expired && !artwork.collected_by),
  )

  async function loadCanvasState(): Promise<void> {
    isLoading.value = true
    try {
      const canvasState = await canvasApi.getCanvasState()
      artworks.value = canvasState.artworks
      bounds.value = canvasState.bounds
    } catch (error) {
      console.error('Failed to load canvas state:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadArtworksInArea(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
  ): Promise<void> {
    try {
      const response = await canvasApi.getArtworksInArea(minX, maxX, minY, maxY)
      // Update existing artworks or add new ones
      response.artworks.forEach((newArtwork) => {
        const existingIndex = artworks.value.findIndex((a) => a.id === newArtwork.id)
        if (existingIndex >= 0) {
          artworks.value[existingIndex] = newArtwork
        } else {
          artworks.value.push(newArtwork)
        }
      })
    } catch (error) {
      console.error('Failed to load artworks in area:', error)
    }
  }

  function handleWebSocketMessage(message: WebSocketMessage): void {
    console.log(message)
    switch (message.type) {
      case 'artwork_placed':
        artworks.value.push(message.data)
        updateBounds(message.data)
        break

      case 'artwork_collected':
        const collectedIndex = artworks.value.findIndex((a) => a.id === message.data.artworkId)
        if (collectedIndex >= 0) {
          artworks.value[collectedIndex].collected_by = message.data.collectorId
          artworks.value[collectedIndex].collected_at = new Date().toISOString()
        }
        break

      case 'artwork_expired':
        message.data.expiredIds.forEach((id: number) => {
          const expiredIndex = artworks.value.findIndex((a) => a.id === id)
          if (expiredIndex >= 0) {
            artworks.value[expiredIndex].is_expired = true
          }
        })
        break
    }
  }

  function updateBounds(artwork: Artwork): void {
    bounds.value.minX = Math.min(bounds.value.minX, artwork.x)
    bounds.value.maxX = Math.max(bounds.value.maxX, artwork.x + artwork.width)
    bounds.value.minY = Math.min(bounds.value.minY, artwork.y)
    bounds.value.maxY = Math.max(bounds.value.maxY, artwork.y + artwork.height)
  }

  function selectArtwork(artwork: Artwork | null): void {
    selectedArtwork.value = artwork
  }

  function getArtworkAt(x: number, y: number): Artwork | null {
    return (
      activeArtworks.value.find(
        (artwork) =>
          x >= artwork.x &&
          x < artwork.x + artwork.width &&
          y >= artwork.y &&
          y < artwork.y + artwork.height,
      ) || null
    )
  }

  function startWebSocketConnection(): void {
    connect('ws://192.168.0.106:8000/ws', handleWebSocketMessage)
  }

  function stopWebSocketConnection(): void {
    disconnect()
  }

  return {
    artworks: readonly(artworks),
    bounds: readonly(bounds),
    activeArtworks,
    isLoading: readonly(isLoading),
    selectedArtwork: readonly(selectedArtwork),
    loadCanvasState,
    loadArtworksInArea,
    selectArtwork,
    getArtworkAt,
    startWebSocketConnection,
    stopWebSocketConnection,
  }
})
