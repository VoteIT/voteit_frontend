import { computed, Ref } from 'vue'

import { AgendaItem } from './types'

export default function useAgendaTags (agendaItems: Ref<AgendaItem[]>) {
  const agendaTags = computed(() => [...new Set(agendaItems.value.flatMap(ai => ai.tags))])

  return {
    agendaTags
  }
}
