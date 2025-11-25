import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { userApi } from '@/services/api'
import { unref, type MaybeRef } from 'vue'

export function useProfile(userId: MaybeRef<string>) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userApi.getProfile(unref(userId)).then((data) => data.profile),
    enabled: !!unref(userId),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: ({ profile }) => {
      queryClient.setQueryData(['profile', profile.id], () => profile)
    },
  })
}
