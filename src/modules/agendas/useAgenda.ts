import { computed, MaybeRef, Ref, unref } from 'vue'

import { AgendaItem } from '@/modules/agendas/types'
import useAgendaStore from './useAgendaStore'
import { agendaItemType } from './contentTypes'

// Must supply meetingId
// Optionally supply a tag for using filteredAgenda
export default function useAgenda(
  meetingId: MaybeRef<number>,
  tag?: Ref<string | undefined>
) {
  const { getAgendaItems } = useAgendaStore()

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
    agendaItemType.sm.getStateList().map((state) => ({
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
