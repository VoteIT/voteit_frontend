import { reactive } from 'vue'

import { dateify } from '@/utils'

import useAuthentication from '../../composables/useAuthentication'

import Channel from '@/contentTypes/Channel'
import { SpeakerStartStopMessage } from '@/contentTypes/messages'
import { AgendaItem } from '../agendas/types'
import { SpeakerList, SpeakerOrderUpdate, SpeakerSystem, SpeakerSystemRole, SpeakerSystemState } from './types'
import { speakerListType, speakerSystemType } from './contentTypes'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
export const currentlySpeaking = reactive<Map<number, SpeakerStartStopMessage>>(new Map()) // Map list pk to current speaker messages
const systemCurrentlySpeaking = reactive<Map<number, SpeakerStartStopMessage>>(new Map()) // Map system pk to current speaker messages
export const speakerQueues = reactive<Map<number, number[]>>(new Map()) // Map list pk to a list of user pks

speakerSystemType.channel.updateMap(speakerSystems)

const { hasRole } = speakerSystemType.useContextRoles()

const listChannel = speakerListType.channel
  .updateMap(speakerLists)
  .on<SpeakerOrderUpdate>('order', ({ pk, queue }) => {
    speakerQueues.set(pk, queue)
  })

new Channel('speaker')
  .on<SpeakerStartStopMessage>('started', payload => {
    currentlySpeaking.set(payload.speaker_list, dateify(payload, 'started'))
    const list = speakerLists.get(payload.speaker_list)
    if (list) systemCurrentlySpeaking.set(list.speaker_system, payload)
  })
  .on<SpeakerStartStopMessage>('stopped', payload => {
    currentlySpeaking.delete(payload.speaker_list)
    const list = speakerLists.get(payload.speaker_list)
    if (list) systemCurrentlySpeaking.delete(list.speaker_system)
  })

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

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaItem: number, filter: (list: SpeakerList) => boolean = () => true): SpeakerList[] {
    return [...iterSpeakerLists(
      list => list.agenda_item === agendaItem && filter(list)
    )]
  }

  function getSystemSpeakerLists (system: SpeakerSystem, agendaItem?: AgendaItem): SpeakerList[] {
    return [...iterSpeakerLists(list => {
      if (list.speaker_system !== system.pk) return false
      return !agendaItem || list.agenda_item === agendaItem.pk
    })]
  }

  function getSystem (pk: number) {
    return speakerSystems.get(pk)
  }

  function getSystems (meeting: number, nonActive = false, isModerator = false): SpeakerSystem[] {
    // For meeting pk
    // By default only active systems
    return [...iterSpeakerSystems(
      s => (s.meeting === meeting) &&
      (nonActive || s.state === SpeakerSystemState.Active) &&
      (!isModerator || hasRole(s.pk, SpeakerSystemRole.ListModerator))
    )]
  }

  function getSystemActiveSpeaker (system: SpeakerSystem): SpeakerStartStopMessage | undefined {
    return systemCurrentlySpeaking.get(system.pk)
  }

  function getList (pk: number) {
    return speakerLists.get(pk)
  }
  function getQueue (list: SpeakerList) {
    return speakerQueues.get(list.pk) || []
  }
  function getCurrent (list: SpeakerList) {
    return currentlySpeaking.get(list.pk)
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
    return listChannel.methodCall('enter', { pk: list.pk })
  }
  function leaveList (list: SpeakerList) {
    return listChannel.methodCall('leave', { pk: list.pk })
  }
  function userInList (list: SpeakerList) {
    const queue = speakerQueues.get(list.pk)
    if (user.value) {
      return queue?.includes(user.value.pk)
    }
  }

  function moderatorEnterList (list: SpeakerList, userid: number) {
    return listChannel.methodCall('mod_enter', {
      pk: list.pk,
      userid
    })
  }
  function moderatorLeaveList (list: SpeakerList, userid: number) {
    return listChannel.methodCall('mod_leave', {
      pk: list.pk,
      userid
    })
  }

  // Start by userid, or first in queue
  function startSpeaker (list: SpeakerList, userid: number) {
    userid = userid || getQueue(list)[0]
    listChannel.methodCall('start_user', {
      pk: list.pk,
      userid
    })
  }

  async function stopSpeaker (list: SpeakerList) {
    const current = getCurrent(list)
    if (current) {
      await listChannel.methodCall('stop_user', {
        pk: list.pk,
        userid: current.userid
      })
    }
  }

  function undoSpeaker (list: SpeakerList) {
    listChannel.methodCall('mod_undo', {
      pk: list.pk
    })
  }

  function shuffleList (list: SpeakerList) {
    listChannel.methodCall('mod_shuffle', {
      pk: list.pk
    })
  }

  async function setActiveList (list: SpeakerList, stopActiveSpeaker = false) {
    if (stopActiveSpeaker) {
      const system = getSystem(list.speaker_system)
      const activeList = system?.active_list && getList(system.active_list)
      if (activeList) await stopSpeaker(activeList)
    }
    await listChannel.methodCall('set_active', { pk: list.pk })
  }

  return {
    getSystem,
    getSystemActiveSpeaker,
    getSystems,
    getSystemSpeakerLists,
    getList,
    getQueue,
    getCurrent,
    getAgendaSpeakerLists,
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
