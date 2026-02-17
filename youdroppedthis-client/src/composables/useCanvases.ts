import { type Ref } from 'vue'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { canvasApi } from '@/services/api'
import type { CanvasInfo } from '@/shared/types'

export const ITEMS_PER_PAGE = 16

export function useHostedCanvases(userId: Ref<string>) {
  return useInfiniteQuery({
    queryKey: ['canvases', 'user', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await canvasApi.getCanvases(userId.value, pageParam, ITEMS_PER_PAGE)
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.canvases.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined,
  })
}

export function useNowActiveCanvases() {
  return useQuery({
    queryKey: ['canvases', 'now'],
    queryFn: () => canvasApi.getNowActiveCanvases(),
  })
}

export function useCreateCanvas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: canvasApi.createCanvas,
    onSuccess: ({ userProfile, canvas }) => {
      queryClient.resetQueries({ queryKey: ['canvases', 'user', userProfile.id] })
      queryClient.resetQueries({ queryKey: ['transactions'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
    },
  })
}

export function useCanvas(canvasId: Ref<number | undefined>) {
  return useQuery({
    queryKey: ['canvas', canvasId],
    queryFn: () => {
      const id = canvasId.value
      if (id) return canvasApi.getCanvasInfo(id)
      return null
    },
    enabled: !!canvasId.value,
  })
}

export function useCanvasActivity(canvasId: Ref<number>, userId?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['canvas-activity', canvasId, userId],
    queryFn: () => {
      const id = canvasId.value
      if (id && userId?.value) return canvasApi.getMyRecentActivity(id)
      return null
    },
  })
}

export function useClaimHostReward(canvasId: Ref<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => canvasApi.claimHostReward(canvasId.value),
    onSuccess: ({ userProfile, canvas }) => {
      queryClient.setQueryData(['canvas', canvasId], (data?: { canvas: CanvasInfo }) => ({
        canvas: { ...data?.canvas, ...canvas },
      }))
      queryClient.resetQueries({ queryKey: ['transactions'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
    },
  })
}

export function useSyncCanvasState(canvasId: Ref<number>) {
  const queryClient = useQueryClient()
  return (canvasInfo: Partial<CanvasInfo>) => {
    queryClient.setQueryData(['canvas', canvasId], (data?: { canvas: CanvasInfo }) => ({
      canvas: { ...data?.canvas, ...canvasInfo },
    }))
  }
}
