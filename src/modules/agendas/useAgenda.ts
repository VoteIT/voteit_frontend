import { computed, MaybeRef, Ref, unref } from 'vue'
import { useRoute } from 'vue-router'

import { AgendaItem } from '@/modules/agendas/types'
import { agendaItemStates } from './workflowStates'
import useAgendaStore from './useAgendaStore'

// Must supply meetingId
// Optionally supply a tag for using filteredAgenda
export default function useAgenda(
  meetingId: MaybeRef<number>,
  tag?: Ref<string | undefined>
) {
  const { getAgendaItems, getLastRead } = useAgendaStore()
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

  return {
    agenda,
    agendaStates,
    filteredAgenda
  }
}
