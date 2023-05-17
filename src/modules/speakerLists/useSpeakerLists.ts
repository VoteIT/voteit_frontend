import { filter } from 'itertools'
import { countBy, orderBy } from 'lodash'
import { reactive } from 'vue'

import { user } from '@/composables/useAuthentication'

import { SpeakerList, SpeakerSystem, Speaker, HistoricSpeaker, CurrentSpeaker } from './types'
import { speakerListType, speakerSystemType, speakerType } from './contentTypes'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
const speakers = reactive<Map<number, Speaker>>(new Map())

speakerSystemType
  .updateMap(speakerSystems)
  .getChannel('sls').onLeave(uri => {
    console.log('leaving', uri, 'TODO: Clean up speakerLists, but only if they\'re not protected from other channels. This will need some architecture.')
  })

speakerListType.updateMap(speakerLists)
speakerType.updateMap(speakers)

function isCurrentSpeaker (speaker: Speaker): speaker is CurrentSpeaker {
  return !speaker.seconds && !!speaker.started
}

function isHistoricSpeaker (speaker: Speaker): speaker is HistoricSpeaker {
  return !!(speaker.seconds && speaker.started)
}

export function getCurrent (list: number) {
  for (const speaker of speakers.values()) {
    if (speaker.speaker_list === list && isCurrentSpeaker(speaker)) return speaker
  }
}
function getHistory (list: number) {
  return orderBy(
    filter(
      speakers.values(),
      speaker => speaker.speaker_list === list && isHistoricSpeaker(speaker)
    ),
    'started', 'desc'
  ) as HistoricSpeaker[]
}
function getList (pk: number) {
  return speakerLists.get(pk)
}
function getSystem (pk: number) {
  return speakerSystems.get(pk)
}

function getSystems (meeting: number, _filter?: (system: SpeakerSystem) => boolean): SpeakerSystem[] {
  return filter(
    speakerSystems.values(),
    s => s.meeting === meeting && (!_filter || _filter(s))
  )
}

function getTimesSpoken (list: number) {
  const spokenUserIds = getHistory(list).map(({ user }) => user)
  return countBy(spokenUserIds)
}

function getAgendaSpeakerLists (agendaItem: number, _filter: (list: SpeakerList) => boolean = () => true): SpeakerList[] {
  return filter(
    speakerLists.values(),
    list => list.agenda_item === agendaItem && _filter(list)
  )
}

function getSystemSpeakerLists (systemId: number, agendaItem?: number): SpeakerList[] {
  return filter(
    speakerLists.values(),
    list => (
      list.speaker_system === systemId &&
      (!agendaItem || list.agenda_item === agendaItem)
    )
  )
}

function getSystemActiveSpeaker (system: SpeakerSystem): Speaker | undefined {
  if (!system.active_list) return
  const speakerList = speakerLists.get(system.active_list)
  return speakerList && getCurrent(speakerList.pk)
}

function makeUniqueListName (title: string): string {
  function checkDuplicate (title: string): boolean {
    for (const list of speakerLists.values()) {
      if (list.title === title) return true
    }
    return false
  }
  if (!checkDuplicate(title)) return title
  for (let i = 1; true; i++) {
    const newTitle = `${title} - ${i}`
    if (!checkDuplicate(newTitle)) return newTitle
  }
}

function enterList (list: SpeakerList) {
  return speakerListType.methodCall('enter', { pk: list.pk })
}
function leaveList (list: SpeakerList) {
  return speakerListType.methodCall('leave', { pk: list.pk })
}
function userInList (list: SpeakerList) {
  return !!user.value && list.queue.includes(user.value.pk)
}

function moderatorEnterList (list: SpeakerList, user: number) {
  return speakerListType.methodCall('mod_enter', {
    pk: list.pk,
    user
  })
}
function moderatorLeaveList (list: SpeakerList, user: number) {
  return speakerListType.methodCall('mod_leave', {
    pk: list.pk,
    user
  })
}

// Start by user pk, or first in queue
function startSpeaker (list: SpeakerList, user?: number) {
  user = user || list.queue[0]
  speakerListType.methodCall('start_user', {
    pk: list.pk,
    user
  })
}

async function stopSpeaker (list: SpeakerList) {
  const current = getCurrent(list.pk)
  if (current) {
    await speakerListType.methodCall('stop_user', {
      pk: list.pk,
      user: current.user
    })
  }
}

function undoSpeaker (list: SpeakerList) {
  speakerListType.methodCall('mod_undo', {
    pk: list.pk
  })
}

function shuffleList (list: SpeakerList) {
  speakerListType.methodCall('mod_shuffle', {
    pk: list.pk
  })
}

async function setActiveList (list: SpeakerList, stopActiveSpeaker = false) {
  if (stopActiveSpeaker) {
    const system = getSystem(list.speaker_system)
    const activeList = system?.active_list && getList(system.active_list)
    if (activeList) await stopSpeaker(activeList)
  }
  await speakerListType.methodCall('set_active', { pk: list.pk })
}

export default function useSpeakerLists () {
  return {
    getAgendaSpeakerLists,
    getCurrent,
    getHistory,
    getList,
    getSystem,
    getSystemActiveSpeaker,
    getSystems,
    getSystemSpeakerLists,
    getTimesSpoken,
    enterList,
    leaveList,
    moderatorEnterList,
    moderatorLeaveList,
    startSpeaker,
    stopSpeaker,
    undoSpeaker,
    shuffleList,
    userInList,
    setActiveList,
    makeUniqueListName
  }
}
