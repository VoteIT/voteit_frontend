import { filter } from 'itertools'
import { computed, reactive, Ref } from 'vue'
import { participantNumberType } from './contentTypes'
import { ParticipantNumber } from './types'

const participantNumberStore = reactive<Map<number, ParticipantNumber>>(new Map())

participantNumberType.updateMap(participantNumberStore)

export default function useParticipantNumbers (meeting: Ref<number>) {
  const participantNumbers = computed(() => filter(
    participantNumberStore.values(),
    pn => pn.meeting === meeting.value
  ))
  const hasParticipantNumbers = computed(() => !!participantNumbers.value.length)

  return {
    participantNumbers,
    hasParticipantNumbers
  }
}
