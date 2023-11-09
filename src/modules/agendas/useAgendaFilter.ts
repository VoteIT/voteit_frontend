import { orderBy } from 'lodash'
import { computed, reactive, Ref } from 'vue'

import { DEFAULT_FILTER_STATES } from '@/modules/proposals/workflowStates'

import { Filter } from './types'

// Store filters for each agenda id
const agendaFilters = reactive<Map<number, Filter>>(new Map())

function setEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

export default function useAgendaFilter(agendaId: Ref<number>) {
  const activeFilter = computed<Filter>(() => {
    if (!agendaFilters.has(agendaId.value)) {
      agendaFilters.set(agendaId.value, {
        order: 'asc',
        states: new Set(DEFAULT_FILTER_STATES),
        tags: new Set()
      })
    }
    return agendaFilters.get(agendaId.value)!
  })

  function orderContent<T extends { created: string }>(content: T[]) {
    return orderBy(content, 'created', activeFilter.value.order)
  }

  /**
   * True if agenda filter is not in initial state.
   */
  const isModified = computed(
    () =>
      activeFilter.value.order === 'desc' ||
      !!activeFilter.value.tags.size ||
      !setEqual(activeFilter.value.states, new Set(DEFAULT_FILTER_STATES))
  )

  return {
    activeFilter,
    isModified,
    orderContent
  }
}
