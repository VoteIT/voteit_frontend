import { readonly, shallowRef } from 'vue'
import { meetingDialectType } from '../contentTypes'
import { MeetingDialectDefinition } from '../types'

const dialectStore = shallowRef<MeetingDialectDefinition[] | null>(null)

async function loadDialects() {
  if (dialectStore.value) return
  const data = await meetingDialectType.api.list()
  dialectStore.value = data
}

export default function useDialects() {
  return {
    loadDialects,
    installableDialects: readonly(dialectStore)
  }
}
