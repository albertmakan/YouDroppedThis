import { useQuery } from '@tanstack/vue-query'
import { canvasApi } from '@/services/api'
import { unref, type MaybeRef } from 'vue'

export function useTopCanvases() {
  return useQuery({
    queryKey: ['top-canvases'],
    queryFn: () => canvasApi.getTopCanvases(),
  })
}

export function useCanvas(canvasId: MaybeRef<number | undefined>) {
  return useQuery({
    queryKey: ['canvas', canvasId],
    queryFn: () => {
      const id = unref(canvasId)
      if (id) return canvasApi.getCanvasInfo(id)
    },
    enabled: !!unref(canvasId),
  })
}
