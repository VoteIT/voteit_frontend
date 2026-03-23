import { onBeforeMount, watch } from 'vue'

import type { LoaderCallback } from '@/composables/useLoader'

import useAuthStore from '../auth/useAuthStore'
import useMeetingStore from './useMeetingStore'

export default function useMeetings(
  loader: (...callbacks: LoaderCallback[]) => void
) {
  const authStore = useAuthStore()
  const store = useMeetingStore()

  onBeforeMount(() => {
    if (authStore.isAuthenticated) loader(store.fetchMeetings)
  })

  // User could be logged in/out or switched directly. Always clear meetings first.
  watch(
    () => authStore.user,
    (value) => {
      store.clearMeetings()
      if (value) store.fetchMeetings()
    }
  )
}
