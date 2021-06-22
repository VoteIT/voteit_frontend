import { reactive } from 'vue'
import wu from 'wu'

import { dateify } from '@/utils'
import speakerListType from '@/contentTypes/speakerList'
import speakerSystemType, { SpeakerSystem } from '@/contentTypes/speakerSystem'

import useAuthentication from '../useAuthentication'

import { AgendaItem, SpeakerList, SpeakerOrderUpdate, SpeakerSystemRole } from '@/contentTypes/types'
import { SpeakerSystemState } from '@/contentTypes/speakerSystem/workflowStates'
import Channel from '@/contentTypes/Channel'
import { SpeakerStartStopMessage } from '@/contentTypes/messages'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
export const currentlySpeaking = reactive<Map<number, SpeakerStartStopMessage>>(new Map()) // Map list pk to current speaker messages
export const speakerQueues = reactive<Map<number, number[]>>(new Map()) // Map list pk to a list of user pks

speakerSystemType.getChannel()
  .updateMap(speakerSystems)

const { hasRole } = speakerSystemType.useContextRoles()

const listChannel = speakerListType.getChannel()
  .updateMap(speakerLists)
  .on<SpeakerOrderUpdate>('order', ({ pk, queue, current }) => {
    speakerQueues.set(pk, queue)
    // currentlySpeaking.set(pk, current)
  })

new Channel<SpeakerStartStopMessage>('speaker')
  .on<SpeakerStartStopMessage>('started', payload => {
    currentlySpeaking.set(payload.speaker_list, dateify(payload, 'started'))
  })
  .on<SpeakerStartStopMessage>('stopped', payload => {
    currentlySpeaking.delete(payload.speaker_list)
  })

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaItem: number, isSpeaker = false): SpeakerList[] {
    const lists = [...wu(speakerLists.values()).filter(l => l.agenda_item === agendaItem)]
    if (isSpeaker) return lists.filter(l => hasRole(l.speaker_system, SpeakerSystemRole.Speaker))
    return lists
  }

  function getSystemSpeakerLists (system: SpeakerSystem, agendaItem?: AgendaItem) {
    return [
      ...wu(speakerLists.values())
        .filter(
          l => l.speaker_system === system.pk &&
               (!agendaItem || l.agenda_item === agendaItem.pk)
        )
    ]
  }

  function getSystem (pk: number) {
    return speakerSystems.get(pk)
  }

  function getSystems (meeting: number, nonActive = false, isModerator = false) {
    // For meeting pk
    // By default only active systems
    return [
      ...wu(speakerSystems.values())
        .filter(s => (s.meeting === meeting) &&
          (nonActive || s.state === SpeakerSystemState.Active) &&
          (!isModerator || hasRole(s.pk, SpeakerSystemRole.ListModerator))
        )
    ]
    // const systems = []
    // for (const s of speakerSystems.values()) {
    //   if (s.meeting === meeting && (all || s.state === SpeakerSystemState.Active)) {
    //     systems.push(s)
    //   }
    // }
    // return systems
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
    const checkDuplicate = (title: string) => {
      for (const list of speakerLists.values()) {
        if (list.title === title) return true
      }
    }
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

  function stopSpeaker (list: SpeakerList) {
    const current = getCurrent(list)
    if (current) {
      listChannel.methodCall('stop_user', {
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

  function setActiveList (list: SpeakerList) {
    listChannel.methodCall('set_active', { pk: list.pk })
  }

  return {
    getSystem,
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
    userInList,
    setActiveList,
    makeUniqueListName
  }
}
