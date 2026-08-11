import { DateTime, Duration } from 'luxon'
import { Ref, computed, ref } from 'vue'

import { addResponseHook } from '@/utils/restApi'

const serverAhead = ref(Duration.fromMillis(0))

// Intercept server time until we can calculate a valid serverAhead value.
// `unsubscribe` is only read once a response arrives, so it is always assigned.
const unsubscribe = addResponseHook((response) => {
  try {
    const serverTime = DateTime.fromRFC2822(response.headers.get('date') ?? '')
    if (!serverTime.isValid) return
    // Go ahead with diff calculation
    serverAhead.value = serverTime.diff(DateTime.now())
    console.log(
      `Server is ${Math.abs(serverAhead.value.milliseconds)} ms ${
        serverAhead.value.milliseconds > 0 ? 'ahead of' : 'behind'
      } you`
    )
    unsubscribe()
  } catch {
    // Did not get an OK datetime string. That's OK.
  }
})

// Adjust serverAhead value if we got a date in the future.
function adjustServerAhead(date: DateTime) {
  const msAhead = date.diff(DateTime.now())
  if (msAhead > serverAhead.value) {
    console.log(`Adjusting serverAhead to ${msAhead} ms ahead`)
    serverAhead.value = msAhead
  }
}

function serverNow() {
  return DateTime.now().plus(serverAhead.value)
}

export default function useServerDateTime(date: Ref<string>) {
  const dateTime = computed(() => DateTime.fromISO(date.value))
  adjustServerAhead(dateTime.value)

  return {
    dateTime,
    serverAhead,
    serverNow
  }
}
