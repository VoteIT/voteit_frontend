import { SpeakerList, AgendaItem } from '../types'

function canAdd (agendaItem: AgendaItem) {
  return false
}
function canChange (speakerList: SpeakerList) {
  return false
}
function canStart (speakerList: SpeakerList) {
  return false
}
function canEnter (speakerList: SpeakerList) {
  return false
}
function canLeave (speakerList: SpeakerList) {
  return false
}

export default {
  canAdd,
  canChange,
  canDelete: canChange,
  canEnter,
  canLeave,
  canStart
}
