import useAuthentication from '@/composables/useAuthentication'
import { speakerSystems, currentlySpeaking } from '@/modules/speakerLists/useSpeakerLists'

import { Predicate, SpeakerList } from '../types'
import speakerSystemRules from '../speakerSystem/rules'

import { SpeakerListState } from './workflowStates'
import { SpeakerSystem } from '@/modules/speakerLists/types'

const { user } = useAuthentication()

function getSystem (list: SpeakerList) {
  return speakerSystems.get(list.speaker_system)
}

const isActive: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  // eslint-disable-next-line camelcase
  return system?.active_list === list.pk
}
const isCurrentlySpeaking: Predicate = (list: SpeakerList) => {
  return currentlySpeaking.get(list.pk) === user.value?.pk
}
const isOpen: Predicate = (list: SpeakerList) => {
  return list.state === SpeakerListState.Open
}

const canActivate: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && canAdd(system) && system.active_list !== list.pk && !speakerSystemRules.hasActiveSpeaker(system)
}
const canAdd: Predicate = (system: SpeakerSystem) => {
  return speakerSystemRules.isModerator(system) && !speakerSystemRules.isArchived(system)
}
const canChange: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && canAdd(system)
}

const canStart: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && isActive(list) && speakerSystemRules.isModerator(system) && speakerSystemRules.isActive(system)
}
const canStop: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && isActive(list) && speakerSystemRules.isModerator(system)
}
const canEnter: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && (
    (speakerSystemRules.isSpeaker(system) && isOpen(list) && speakerSystemRules.isActive(system)) ||
    (speakerSystemRules.isModerator(system) && !speakerSystemRules.isArchived(system))
  )
}
const canLeave: Predicate = (list: SpeakerList) => {
  const system = getSystem(list)
  return !!system && (speakerSystemRules.isModerator(system) || speakerSystemRules.isSpeaker(system)) && !isCurrentlySpeaking(list)
}

export default {
  canActivate,
  canAdd,
  canChange,
  canDelete: canChange,
  canEnter,
  canLeave,
  canStart,
  canStop
}
