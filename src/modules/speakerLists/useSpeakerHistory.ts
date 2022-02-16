import { orderBy } from 'lodash'
import { computed, reactive, Ref, watch } from 'vue'
import { speakerHistoryType } from './contentTypes'
import { SpeakerHistory } from './types'

const speakerHistory = reactive(new Map<string, SpeakerHistory[]>())

export default function useSpeakerHistory (meeting: Ref<number>, speakerSystem: Ref<number | undefined>) {
  const key = computed(() => {
    if (!meeting.value) return
    if (speakerSystem.value) return `${meeting.value}/${speakerSystem.value}`
    return String(meeting.value)
  })
  const history = computed(() => key.value && speakerHistory.get(key.value))

  watch(key, async (key) => {
    if (!key) return
    const { data } = await speakerHistoryType.api.list({
      meeting: meeting.value,
      speaker_system: speakerSystem.value
    })
    speakerHistory.set(key, orderBy(data, ['seconds_spoken'], ['desc']))
  }, { immediate: true })

  return {
    history
  }
}
