import { computed } from 'vue'

import { slugify } from '@/utils'
import useMeeting from '@/modules/meetings/useMeeting'

import useAgenda from './useAgenda'

export default function useAgendaItem () {
  const { agendaId, agendaItem } = useAgenda()
  const { meetingPath } = useMeeting()

  const agendaItemPath = computed(() => {
    if (!meetingPath.value || !agendaItem.value) return
    return `${meetingPath.value}/a/${agendaItem.value.pk}/${slugify(agendaItem.value.title)}`
  })

  return {
    agendaId,
    agendaItem,
    agendaItemPath
  }
}
