import { mapFilter } from '@/utils'
import { computed, reactive, Ref } from 'vue'
import { participantNumberType } from './contentTypes'
import { ParticipantNumber } from './types'

const participantNumbers = reactive<Map<number, ParticipantNumber>>(new Map())

participantNumberType.updateMap(participantNumbers)

export default function useParticipantNumbers (meeting: Ref<number>) {
  return {
    participantNumbers: computed(() => [...mapFilter(participantNumbers, pn => pn.meeting === meeting.value)])
  }
}
