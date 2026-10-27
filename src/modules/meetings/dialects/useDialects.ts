import { readonly, shallowRef } from 'vue'
import { localeChangedEvent } from '@/utils/events'
import { meetingDialectType } from '../contentTypes'
import { MeetingDialectDefinition } from '../types'

const dialectStore = shallowRef<MeetingDialectDefinition[] | null>(null)

async function loadDialects() {
  if (dialectStore.value) return
  const data = await meetingDialectType.api.list()
  dialectStore.value = data
}

// Dialect titles and descriptions are translated by the backend
localeChangedEvent.on(async () => {
  if (!dialectStore.value) return
  try {
    dialectStore.value = await meetingDialectType.api.list()
  } catch (e) {
    console.error('Refetching meeting dialects failed', e)
  }
})

export default function useDialects() {
  return {
    loadDialects,
    installableDialects: readonly(dialectStore)
  }
}
