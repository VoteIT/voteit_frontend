import { watch } from 'vue'

import useAuthStore from '../auth/useAuthStore'
import useMeetingStore from './useMeetingStore'

/**
 * Keep the meeting list in step with who is signed in. The initial fetch is a
 * route requirement (`meetingListRequirement`), so it's already in by the time
 * a view using this is mounted.
 */
export default function useMeetings() {
  const authStore = useAuthStore()
  const store = useMeetingStore()

  // User could be logged in/out or switched directly. Always clear meetings first.
  watch(
    () => authStore.user,
    (value) => {
      store.clearMeetings()
      if (value) store.fetchMeetings()
    }
  )
}
