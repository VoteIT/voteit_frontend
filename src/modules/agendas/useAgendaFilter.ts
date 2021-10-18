import { computed, reactive } from 'vue'

import { DEFAULT_FILTER_STATES } from '@/modules/proposals/workflowStates'

import { Filter } from './types'
import useAgendaItem from './useAgendaItem'

// Store filters for each agenda id
const agendaFilters = reactive<Map<number, Filter>>(new Map())

function setEqual (a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

export default function useAgendaFilter () {
  const { agendaId } = useAgendaItem()
  const activeFilter = computed<Filter>(() => {
    if (!agendaFilters.has(agendaId.value)) {
      agendaFilters.set(agendaId.value, {
        order: 'created',
        states: new Set(DEFAULT_FILTER_STATES),
        tags: new Set()
      })
    }
    return agendaFilters.get(agendaId.value) as Filter
  })

  const isModified = computed(() => activeFilter.value.order !== 'created' || !!activeFilter.value.tags.size || !setEqual(activeFilter.value.states, new Set(DEFAULT_FILTER_STATES)))

  return {
    activeFilter,
    isModified
  }
}
