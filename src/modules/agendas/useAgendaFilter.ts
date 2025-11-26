import { all, sorted } from 'itertools'
import { computed, reactive, Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

import { DEFAULT_FILTER_STATES } from '@/modules/proposals/workflowStates'
import { ProposalState } from '../proposals/types'

import { AgendaFilter } from './types'

/**
 * Important to create a new Array when resetting
 */
function getDefaultFilters(): AgendaFilter {
  return {
    order: 'asc',
    states: [...DEFAULT_FILTER_STATES],
    tag: null
  }
}

// Store filters globally
const agendaFilter = reactive(getDefaultFilters())

function setEqual(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && all(a, (value) => b.has(value))
}

export default function useAgendaFilter() {
  function clearFilter() {
    Object.assign(agendaFilter, getDefaultFilters())
  }

  function clearTag() {
    agendaFilter.tag = null
  }

  function orderContent<T extends { created: string }>(content: T[]) {
    return sorted(content, (obj) => obj.created, agendaFilter.order === 'desc')
  }

  /**
   * True if agenda filter is not in initial state.
   */
  const isModified = computed(
    () =>
      agendaFilter.order === 'desc' ||
      !!agendaFilter.tag ||
      !setEqual(new Set(agendaFilter.states), new Set(DEFAULT_FILTER_STATES))
  )

  onBeforeRouteLeave(clearTag)
  onBeforeRouteUpdate(clearTag)

  return {
    agendaFilter,
    isModified,
    clearFilter,
    clearTag,
    stateIncluded(state: ProposalState) {
      return agendaFilter.states.includes(state)
    },
    tagIncluded(tags: string[]) {
      return !agendaFilter.tag || tags.includes(agendaFilter.tag)
    },
    orderContent
  }
}
