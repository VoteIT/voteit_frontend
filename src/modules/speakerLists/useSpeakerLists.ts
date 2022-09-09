import { orderBy } from 'lodash'
import { reactive } from 'vue'

import { mapFilter } from '@/utils'

import useAuthentication from '../../composables/useAuthentication'

import { SpeakerList, SpeakerOrderUpdate, SpeakerSystem, Speaker, TimesSpokenEntry, HistoricSpeaker, CurrentSpeaker } from './types'
import { speakerListType, speakerSystemType, speakerType } from './contentTypes'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
// export const currentlySpeaking = reactive<Map<number, SpeakerStartedMessage>>(new Map()) // Map list pk to current speaker messages
// const systemCurrentlySpeaking = reactive<Map<number, SpeakerStartedMessage>>(new Map()) // Map system pk to current speaker messages
// const speakerHistory = reactive<Map<number, SpeakerStoppedMessage>>(new Map()) // Stopped speakers. Filter to get messages for specific list.
export const speakerQueues = reactive<Map<number, number[]>>(new Map()) // Map list pk to a list of user pks
const timesSpoken = reactive<Map<number, TimesSpokenEntry[]>>(new Map()) // Map list pk to list of times spoken entries
const speakers = reactive<Map<number, Speaker>>(new Map())

speakerSystemType.updateMap(speakerSystems)

speakerListType
  .updateMap(speakerLists)
  // eslint-disable-next-line camelcase
  .on<SpeakerOrderUpdate>('order', ({ pk, queue, times_spoken }) => {
    speakerQueues.set(pk, queue)
    timesSpoken.set(pk, times_spoken)
  })

speakerType
  .updateMap(speakers)

function * iterSpeakerLists (filter: (list: SpeakerList) => boolean): Generator<SpeakerList, void> {
  for (const list of speakerLists.values()) {
    if (filter(list)) yield list
  }
}

function * iterSpeakerSystems (filter: (system: SpeakerSystem) => boolean): Generator<SpeakerSystem, void> {
  for (const system of speakerSystems.values()) {
    if (filter(system)) yield system
  }
}

function isCurrentSpeaker (speaker: Speaker): speaker is CurrentSpeaker {
  return !speaker.seconds
}

export function getCurrent (list: number) {
  for (const speaker of speakers.values()) {
    if (speaker.speaker_list === list && isCurrentSpeaker(speaker)) return speaker
  }
}
function getHistory (list: number) {
  return orderBy([...mapFilter(
    speakers, speaker => speaker.speaker_list === list && !isCurrentSpeaker(speaker)
  )], ['started'], ['desc']) as HistoricSpeaker[]
}
function getList (pk: number) {
  return speakerLists.get(pk)
}
function getSystem (pk: number) {
  return speakerSystems.get(pk)
}

function getSystems (meeting: number, filter?: (system: SpeakerSystem) => boolean): SpeakerSystem[] {
  return [...iterSpeakerSystems(
    s => s.meeting === meeting && (!filter || filter(s))
  )]
}

function getTimesSpoken (list: number) {
  return new Map(timesSpoken.get(list))
}

function getQueue (list: number) {
  return speakerQueues.get(list) || []
}

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaItem: number, filter: (list: SpeakerList) => boolean = () => true): SpeakerList[] {
    return [...iterSpeakerLists(
      list => list.agenda_item === agendaItem && filter(list)
    )]
  }

  function getSystemSpeakerLists (systemId: number, agendaItem?: number): SpeakerList[] {
    return [...iterSpeakerLists(list => list.speaker_system === systemId &&
      (!agendaItem || list.agenda_item === agendaItem)
    )]
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
    const queue = speakerQueues.get(list.pk)
    if (user.value) {
      return queue?.includes(user.value.pk)
    }
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
    user = user || getQueue(list.pk)[0]
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
    getQueue,
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
