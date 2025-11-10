import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Artwork, CanvasInfo } from '@/shared/types'
import { canvasApi, parsePixelData } from '@/services/api'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/realtime-js'

// export const CANVAS_SIZE = 1024
export const CHUNK_SIZE = 16
export const ART_SIZE = 64
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 10
export const CANVAS_BACKGROUND = '#18181b'
export const GRID_COLOR = '#3f3f46'

type CanvasData = {
  config: CanvasInfo
  chunks: Map<string, { arts?: Artwork[]; isLoading: boolean }>
  isLoading: boolean
  channel?: RealtimeChannel
}

export const useCanvasStore = defineStore('canvas', () => {
  const canvases = shallowRef<Map<number, CanvasData>>(new Map())

  const currentCanvasId = ref<number | null>(null)

  const currentCanvas = computed(() =>
    currentCanvasId.value ? canvases.value.get(currentCanvasId.value) : null,
  )

  const canvasChunks = computed(() => currentCanvas.value?.chunks)
  const canvasConfig = computed(() => currentCanvas.value?.config)

  async function loadCanvas(canvasId: number) {
    if (canvases.value.has(canvasId)) {
      currentCanvasId.value = canvasId
      subscribeToCanvas(canvasId)
      return
    }

    const config = await canvasApi.getCanvasInfo(canvasId)

    canvases.value.set(canvasId, { config, chunks: new Map(), isLoading: false })

    currentCanvasId.value = canvasId

    subscribeToCanvas(canvasId)
  }

  function subscribeToCanvas(canvasId: number) {
    const canvas = canvases.value.get(canvasId)
    if (!canvas) return

    const channel = supabase.channel(`canvas:${canvasId}`, { config: { private: true } })

    channel
      .on('broadcast', { event: '*' }, ({ payload, event }) =>
        handleRealtimeEvent(canvasId, event, payload),
      )
      .subscribe(console.log)

    canvas.channel = channel
  }

  function unsubscribeFromCanvas(canvasId: number) {
    const canvas = canvases.value.get(canvasId)
    if (canvas?.channel) {
      canvas.channel.unsubscribe()
      canvas.channel = undefined
    }
  }

  function handleRealtimeEvent(canvasId: number, event: string, payload: any) {
    console.log(canvasId, payload)
    const canvas = canvases.value.get(canvasId)
    if (!canvas) return

    if (event === 'placed') {
      const artwork = payload as Artwork
      artwork.pixels = parsePixelData(artwork.pixel_data)
      const cx = Math.floor(artwork.x / CHUNK_SIZE)
      const cy = Math.floor(artwork.y / CHUNK_SIZE)
      getChunk(cx, cy)?.arts?.push(artwork)
      callbacks.value.onArtworkPlaced?.(artwork)
    } else if (event === 'collected') {
      const { x, y, id, collected_at, collected_by } = payload as Artwork
      const cx = Math.floor(x / CHUNK_SIZE)
      const cy = Math.floor(y / CHUNK_SIZE)
      const collected = getChunk(cx, cy)?.arts?.find((a) => a.id === id)
      if (collected) {
        collected.collected_by = collected_by
        collected.collected_at = collected_at
        collected.collectionEffect = { progress: 0 }
      }
    }
  }

  function cleanup() {
    canvases.value.forEach((_, canvasId) => {
      unsubscribeFromCanvas(canvasId)
    })
    canvases.value.clear()
  }

  function getChunkKey(cx: number, cy: number) {
    return `${cx},${cy}`
  }

  async function loadChunk(cx: number, cy: number, zoom: number) {
    const key = getChunkKey(cx, cy)
    canvasChunks.value?.set(key, { isLoading: true })

    try {
      const response = await canvasApi.getArtworksInArea(1, {
        minX: cx * CHUNK_SIZE,
        maxX: (cx + 1) * CHUNK_SIZE,
        minY: cy * CHUNK_SIZE,
        maxY: (cy + 1) * CHUNK_SIZE,
      })
      canvasChunks.value?.set(key, { arts: response.artworks, isLoading: false })
    } catch (error) {
      console.error('Failed to load chunk:', error)
    }
  }

  function getChunk(cx: number, cy: number) {
    return canvasChunks.value?.get(getChunkKey(cx, cy))
  }

  const callbacks = ref<{
    onArtworkPlaced?: (artwork: Artwork) => void
  }>({})

  function getArtworkAt(x: number, y: number) {
    const cx = Math.floor(x / CHUNK_SIZE)
    const cy = Math.floor(y / CHUNK_SIZE)
    const artworksInChunk = getChunk(cx, cy)?.arts
    if (!artworksInChunk) return
    return (
      artworksInChunk.find((a) => x === a.x && y === a.y && !a.is_expired && !a.collected_by) ||
      null
    )
  }

  return {
    currentCanvasId,
    canvasConfig,
    loadCanvas,
    getChunk,
    loadChunk,
    getArtworkAt,
    callbacks,
    unsubscribeFromCanvas,
  }
})

export function initializeDisintegrationParticles(artwork: Artwork) {
  const particles = []
  const resolution = artwork.pixels?.length || 1
  for (let pixelY = 0; pixelY < resolution; pixelY++) {
    for (let pixelX = 0; pixelX < resolution; pixelX++) {
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
