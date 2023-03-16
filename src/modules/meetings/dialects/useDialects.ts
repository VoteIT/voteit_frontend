import { computed, ref } from 'vue'
import { meetingDialectType } from '../contentTypes'
import { MeetingDialectDefinition } from '../types'

const dialectStore = ref<MeetingDialectDefinition[] | null>(null)

async function loadDialects () {
  const { data } = await meetingDialectType.api.list()
  dialectStore.value = data
}

const installableDialects = computed(() => {
  if (dialectStore.value === null) loadDialects()
  return dialectStore.value
})

export default function useDialects () {
  return {
    installableDialects
  }
}
