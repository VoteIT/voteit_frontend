import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Minimal module to get just the meetingId value, instead of needing the full useMeeting()
 */
export default function useMeetingId() {
  const route = useRoute()
  return computed(() => Number(route.params.id))
}
