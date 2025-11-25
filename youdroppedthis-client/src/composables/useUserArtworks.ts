import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { artworkApi, type PlacementRequest } from '@/services/api'
import { type Ref } from 'vue'
import { createOffscreenCanvas } from '@/components/Artwork/renderArtwork'

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
    onSuccess: ({ userProfile }) => {
      queryClient.invalidateQueries({ queryKey: ['artworks', 'user', userProfile.id, 'placed'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
    },
  })
}

export function useCollectArtwork(canvasId: Ref<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (artworkId: number) => artworkApi.collectArtwork(canvasId.value, artworkId),
    onSuccess: ({ userProfile }) => {
      queryClient.invalidateQueries({ queryKey: ['artworks', 'user', userProfile.id, 'collected'] })
      queryClient.setQueryData(['profile', userProfile.id], () => userProfile)
    },
  })
}
