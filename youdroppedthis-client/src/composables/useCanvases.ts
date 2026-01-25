import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { canvasApi, type CanvasHostingRequest } from '@/services/api'
import { unref, type MaybeRef, type Ref } from 'vue'

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
    mutationFn: (hosting: CanvasHostingRequest) => canvasApi.createCanvas(hosting),
    onSuccess: ({ userProfile }) => {
      queryClient.invalidateQueries({ queryKey: ['canvases', 'user', userProfile.id] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
    },
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
