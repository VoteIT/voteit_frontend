import useAuthentication from '@/composables/useAuthentication'
import { speakerSystems, currentlySpeaking } from '@/composables/meeting/useSpeakerLists'

import { SpeakerList, SpeakerSystem } from '../types'
import speakerSystemRules from '../speakerSystem/rules'

import { SpeakerListState } from './workflowStates'

const { user } = useAuthentication()

function getSystem (list: SpeakerList) {
  return speakerSystems.get(list.speaker_system)
}
function isActive (list: SpeakerList) {
  const system = getSystem(list)
  // eslint-disable-next-line camelcase
  return system?.active_list === list.pk
}
function isCurrentlySpeaking (list: SpeakerList) {
  return currentlySpeaking.get(list.pk) === user.value?.pk
}
function isOpen (list: SpeakerList) {
  return list.state === SpeakerListState.Open
}

function canAdd (system: SpeakerSystem) {
  return speakerSystemRules.isModerator(system) && !speakerSystemRules.isArchived(system)
}
function canChange (list: SpeakerList) {
  const system = getSystem(list)
  return system && canAdd(system)
}
function canStart (list: SpeakerList) {
  const system = getSystem(list)
  return system && isActive(list) && speakerSystemRules.isModerator(system) && speakerSystemRules.isActive(system)
}
function canStop (list: SpeakerList) {
  const system = getSystem(list)
  return system && isActive(list) && speakerSystemRules.isModerator(system)
}
function canEnter (list: SpeakerList) {
  const system = getSystem(list)
  if (system) {
    return (speakerSystemRules.isSpeaker(system) && isOpen(list) && speakerSystemRules.isActive(system)) ||
           (speakerSystemRules.isModerator(system) && !speakerSystemRules.isArchived(system))
  }
}
function canLeave (list: SpeakerList) {
  const system = getSystem(list)
  if (system) {
    return (speakerSystemRules.isModerator(system) || speakerSystemRules.isSpeaker(system)) && !isCurrentlySpeaking(list)
  }
}

export default {
  canAdd,
  canChange,
  canDelete: canChange,
  canEnter,
  canLeave,
  canStart,
  canStop
}
