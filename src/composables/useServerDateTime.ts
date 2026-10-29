import { Ref, computed, ref } from 'vue'

import { parseISO } from '@/utils/dates'
import { addResponseHook } from '@/utils/restApi'

/** How far the server clock is ahead of ours, in milliseconds. */
const serverAhead = ref(0)

// Intercept server time until we can calculate a valid serverAhead value.
// `unsubscribe` is only read once a response arrives, so it is always assigned.
const unsubscribe = addResponseHook((response) => {
  // HTTP Date header, e.g. "Wed, 29 Oct 2026 10:00:00 GMT"
  const serverTime = Date.parse(response.headers.get('date') ?? '')
  if (isNaN(serverTime)) return
  // Go ahead with diff calculation
  serverAhead.value = serverTime - Date.now()
  console.log(
    `Server is ${Math.abs(serverAhead.value)} ms ${
      serverAhead.value > 0 ? 'ahead of' : 'behind'
    } you`
  )
  unsubscribe()
})

// Adjust serverAhead value if we got a date in the future.
function adjustServerAhead(date: number) {
  const msAhead = date - Date.now()
  if (msAhead > serverAhead.value) {
    console.log(`Adjusting serverAhead to ${msAhead} ms ahead`)
    serverAhead.value = msAhead
  }
}

/** Current server time in epoch milliseconds. */
function serverNow() {
  return Date.now() + serverAhead.value
}

export default function useServerDateTime(date: Ref<string>) {
  /** The date in epoch milliseconds */
  const dateTime = computed(() => parseISO(date.value))
  adjustServerAhead(dateTime.value)

  return {
    dateTime,
    serverAhead,
    serverNow
  }
}
