import { filter } from 'itertools'
import { computed, ref } from 'vue'
import { meetingDialectType } from '../contentTypes'
import { MeetingDialectDefinition } from '../types'

const dialectStore = ref<MeetingDialectDefinition[] | null>(null)

function isInstallable (dialect: MeetingDialectDefinition) {
  return dialect.installable
}

async function loadDialects () {
  const { data } = await meetingDialectType.api.list()
  dialectStore.value = data
}

const installableDialects = computed(() => {
  if (dialectStore.value === null) loadDialects()
  return dialectStore.value && filter(dialectStore.value, isInstallable)
})

export default function useDialects () {
  return {
    installableDialects
  }
}
