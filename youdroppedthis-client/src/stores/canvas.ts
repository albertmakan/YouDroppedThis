import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Artwork } from '@/shared/types'
import { canvasApi } from '@/services/api'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/realtime-js'

export const CHUNK_SIZE = 16
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 10
export const CANVAS_BACKGROUND = '#18181b'
export const GRID_COLOR = '#808080'
export const DEFAULT_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#800080',
  '#008080',
  '#000080',
  '#FFA500',
  '#FFC0CB',
  '#A52A2A',
  '#FFFFE0',
  '#ADD8E6',
]

export const useCanvasStore = defineStore('canvas', () => {
  const currentCanvasId = ref<number | null>(null)
  const chunks = shallowRef<Map<string, { arts?: Artwork[]; isLoading: boolean }>>(new Map())
  const subscription = ref<RealtimeChannel | null>(null)
  const realtimeSubscribeState = ref('')

  async function switchCanvas(canvasId: number) {
    await unsubscribeFromCanvas()
    chunks.value.clear()

    currentCanvasId.value = canvasId
    subscribeToCanvas(canvasId)
  }

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
    // console.log(payload)
    if (event === 'placed') {
      const artwork = payload as Artwork
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

  function getChunkKey(cx: number, cy: number) {
    return `${cx},${cy}`
  }

  async function loadChunk(cx: number, cy: number, zoom: number) {
    if (!currentCanvasId.value) return
    const key = getChunkKey(cx, cy)
    chunks.value?.set(key, { isLoading: true })
    try {
      const response = await canvasApi.getArtworksInArea(currentCanvasId.value, {
        minX: cx * CHUNK_SIZE,
        maxX: (cx + 1) * CHUNK_SIZE,
        minY: cy * CHUNK_SIZE,
        maxY: (cy + 1) * CHUNK_SIZE,
      })
      chunks.value?.set(key, { arts: response.artworks, isLoading: false })
    } catch (error) {
      console.error('Failed to load chunk:', error)
    }
  }

  function getChunk(cx: number, cy: number) {
    return chunks.value?.get(getChunkKey(cx, cy))
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
    realtimeSubscribeState,
    switchCanvas,
    getChunk,
    loadChunk,
    getArtworkAt,
    callbacks,
    unsubscribeFromCanvas,
  }
})
