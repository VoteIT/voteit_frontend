import { filter } from 'itertools'
import { computed, MaybeRef, Ref, unref } from 'vue'
import { useRoute } from 'vue-router'

import { AgendaItem } from '@/modules/agendas/types'
import { agendaItemStates } from './workflowStates'
import { Maybe } from 'itertools/types'
import useAgendaStore from './useAgendaStore'

// Must supply meetingId
// Optionally supply a tag for using filteredAgenda
export default function useAgenda(
  meetingId: MaybeRef<number>,
  tag?: Ref<string | undefined>
) {
  const { getAgendaItem, getAgendaItems, getLastRead } = useAgendaStore()
  const route = useRoute()

  function isMeetingAI({ meeting }: AgendaItem) {
    return meeting === unref(meetingId)
  }

  const agenda = computed(() => getAgendaItems(isMeetingAI))

  const filteredAgenda = computed(() =>
    getAgendaItems(
      (ai) => isMeetingAI(ai) && (!tag?.value || ai.tags.includes(tag.value))
    )
  )

  const agendaStates = computed(() =>
    agendaItemStates.map((state) => ({
      state,
      items: getAgendaItems((ai) => isMeetingAI(ai) && ai.state === state.state)
    }))
  )

  function getRelativeAgendaItem(
    agendaItem: AgendaItem,
    positions = 1
  ): Maybe<AgendaItem> {
    const index = agenda.value.indexOf(agendaItem)
    return agenda.value[index + positions]
  }
  function getPreviousAgendaItem(agendaItem: AgendaItem) {
    return getRelativeAgendaItem(agendaItem, -1)
  }
  function getNextAgendaItem(agendaItem: AgendaItem) {
    return getRelativeAgendaItem(agendaItem)
  }

  function hasNewItems(agendaItem: AgendaItem): boolean {
    // If no content, there are no new items
    if (!agendaItem.related_modified) return false
    const lastRead = getLastRead(agendaItem.pk)
    // Else, if no lastRead or set to earlier time, there are new items
    return !lastRead || new Date(agendaItem.related_modified) > lastRead
  }

  // TODO: Don't get this from route. Should be moved
  const agendaId = computed(() => Number(route.params.aid))
  const agendaItem = computed(() => getAgendaItem(agendaId.value))
  const agendaItemLastRead = computed(
    () => getLastRead(agendaId.value) ?? new Date(0)
  ) // Default to epoch
  const previousAgendaItem = computed(
    () => agendaItem.value && getPreviousAgendaItem(agendaItem.value)
  )
  const nextAgendaItem = computed(
    () => agendaItem.value && getNextAgendaItem(agendaItem.value)
  )

  return {
    agenda,
    agendaId,
    agendaItem,
    agendaItemLastRead,
    agendaStates,
    filteredAgenda,
    previousAgendaItem,
    nextAgendaItem,
    getPreviousAgendaItem,
    getNextAgendaItem,
    hasNewItems
  }
}
