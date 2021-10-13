import { computed } from 'vue'

import { slugify } from '@/utils'
import useMeeting from '@/modules/meetings/useMeeting'

import useAgenda from './useAgenda'
import usePolls from '../polls/usePolls'

export default function useAgendaItem () {
  const { agendaId, agendaItem } = useAgenda()
  const { meetingPath } = useMeeting()
  const { allPollTitles } = usePolls()

  const agendaItemPath = computed(() => {
    if (!meetingPath.value || !agendaItem.value) return
    return `${meetingPath.value}/a/${agendaItem.value.pk}/${slugify(agendaItem.value.title)}`
  })

  const nextPollTitle = computed(() => {
    if (!agendaItem.value) return
    for (let n = 1; true; n++) {
      const title = `${agendaItem.value?.title} ${n}`
      if (!allPollTitles.value.includes(title)) return title
    }
  })

  return {
    agendaId,
    agendaItem,
    agendaItemPath,
    nextPollTitle
  }
}
