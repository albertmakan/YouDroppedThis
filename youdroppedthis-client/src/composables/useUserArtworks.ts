import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { artworkApi, type PlacementRequest } from '@/services/api'
import { type Ref } from 'vue'
import { createOffscreenCanvas } from '@/components/Artwork/renderArtwork'
import type { CanvasInfo, RecentActivity } from '@/shared/types'

export const ITEMS_PER_PAGE = 16

export function useUserArtworks(userId: Ref<string>, type: Ref<'placed' | 'collected'>) {
  return useInfiniteQuery({
    queryKey: ['artworks', 'user', userId, type],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await artworkApi.getUserArtworks(
        userId.value,
        type.value,
        pageParam,
        ITEMS_PER_PAGE,
      )
      data.artworks.forEach(
        (artwork) => (artwork.offscreenCanvas = createOffscreenCanvas(artwork.pixel_data)),
      )
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.artworks.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined,
  })
}

export function usePlaceArtwork(canvasId: Ref<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (placement: PlacementRequest) => artworkApi.placeArtwork(canvasId.value, placement),
    onSuccess: ({ userProfile, artwork }) => {
      queryClient.resetQueries({ queryKey: ['artworks', 'user', userProfile.id, 'placed'] })
      queryClient.resetQueries({ queryKey: ['transactions'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
      queryClient.setQueryData(
        ['canvas', canvasId, userProfile.id],
        (data?: { canvas: CanvasInfo; recentActivity: RecentActivity }) => ({
          ...data,
          recentActivity: [
            { artwork_id: artwork.id, event_time: artwork.created_at, kind: 'placement' },
            ...(data?.recentActivity ?? []),
          ] as RecentActivity,
        }),
      )
    },
  })
}

export function useCollectArtwork(canvasId: Ref<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (artworkId: number) => artworkApi.collectArtwork(canvasId.value, artworkId),
    onSuccess: ({ userProfile, artwork }) => {
      queryClient.resetQueries({ queryKey: ['artworks', 'user', userProfile.id, 'collected'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
      queryClient.setQueryData(
        ['canvas', canvasId, userProfile.id],
        (data?: { canvas: CanvasInfo; recentActivity: RecentActivity }) => ({
          ...data,
          recentActivity: [
            { artwork_id: artwork.id, event_time: artwork.collected_at, kind: 'collection' },
            ...(data?.recentActivity ?? []),
          ] as RecentActivity,
        }),
      )
    },
  })
}
