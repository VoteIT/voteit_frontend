import { computed, reactive, Ref } from 'vue'

import { AgendaItem } from './types'

const selectedTags = reactive(new Map<number, string>())

export default function useAgendaTags(agendaItems: Ref<AgendaItem[]>) {
  const agendaTags = computed(() => [
    ...new Set(agendaItems.value.flatMap((ai) => ai.tags))
  ])
  const meetingId = computed(() => agendaItems.value[0]?.meeting)
  const selectedAgendaTag = computed({
    get() {
      if (typeof meetingId.value === 'undefined') return
      return selectedTags.get(meetingId.value)
    },
    set(value) {
      if (!meetingId.value) return
      if (value) selectedTags.set(meetingId.value, value)
      else selectedTags.delete(meetingId.value)
    }
  })

  function aiMatchesTag(ai: AgendaItem) {
    return !selectedAgendaTag.value || ai.tags.includes(selectedAgendaTag.value)
  }

  return {
    agendaTags,
    selectedAgendaTag,
    aiMatchesTag
  }
}
