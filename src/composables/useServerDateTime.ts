import { AxiosResponse } from 'axios'
import { DateTime, Duration } from 'luxon'
import { Ref, computed, ref } from 'vue'

import restApi from '@/utils/restApi'

const serverAhead = ref(Duration.fromMillis(0))
let interceptorId: number | null = null

// Intercept server time until we can calculate a valid serverAhead value
function interceptTime (response: AxiosResponse): AxiosResponse {
  try {
    const serverTime = DateTime.fromRFC2822(response.headers.date)
    if (!serverTime.isValid) return response
    // Go ahead with diff calculation
    serverAhead.value = serverTime.diff(DateTime.now())
    console.log(`Server is ${Math.abs(serverAhead.value.milliseconds)} ms ${serverAhead.value.milliseconds > 0 ? 'ahead of' : 'behind'} you`)
    if (typeof interceptorId === 'number') restApi.interceptors.response.eject(interceptorId)
  } catch {
    // Did not get an OK datetime string. That's OK.
  }
  return response
}
interceptorId = restApi.interceptors.response.use(interceptTime)

// Adjust serverAhead value if we got a date in the future.
function adjustServerAhead (date: DateTime) {
  const msAhead = date.diff(DateTime.now())
  if (msAhead > serverAhead.value) {
    console.log(`Adjusting serverAhead to ${msAhead} ms ahead`)
    serverAhead.value = msAhead
  }
}

function serverNow () {
  return DateTime.now().plus(serverAhead.value)
}

export default function useServerDateTime (date: Ref<string>) {
  const dateTime = computed(() => DateTime.fromISO(date.value))
  adjustServerAhead(dateTime.value)

  return {
    dateTime,
    serverAhead,
    serverNow
  }
}
