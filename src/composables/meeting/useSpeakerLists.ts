import { reactive } from 'vue'
import wu from 'wu'

import { dateify } from '@/utils'
import speakerListType from '@/contentTypes/speakerList'
import speakerSystemType from '@/contentTypes/speakerSystem'

import useAuthentication from '../useAuthentication'

import { SpeakerList, SpeakerOrderUpdate, SpeakerSystem } from '@/contentTypes/types'
import { SpeakerSystemState } from '@/contentTypes/speakerSystem/workflowStates'
import Channel from '@/contentTypes/Channel'
import { SpeakerStartStopMessage } from '@/contentTypes/messages'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
export const currentlySpeaking = reactive<Map<number, SpeakerStartStopMessage>>(new Map()) // Map list pk to current speaker messages
export const speakerQueues = reactive<Map<number, number[]>>(new Map()) // Map list pk to a list of user pks

speakerSystemType.getChannel()
  .updateMap(speakerSystems)

const listChannel = speakerListType.getChannel()
  .updateMap(speakerLists)
  .on('order', (order: any) => {
    const { pk, queue, current } = order as SpeakerOrderUpdate
    speakerQueues.set(pk, queue)
    // currentlySpeaking.set(pk, current)
  })

new Channel<SpeakerStartStopMessage>('speaker')
  .on('started', speaking => {
    currentlySpeaking.set(speaking.speaker_list, dateify(speaking, 'started'))
  })
  .on('stopped', stopped => {
    currentlySpeaking.delete(stopped.speaker_list)
  })

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaPk: number) {
    return [...wu(speakerLists.values()).filter(l => l.agenda_item === agendaPk)]
  }

  function getSystem (pk: number) {
    return speakerSystems.get(pk)
  }

  function getSystems (pk: number, all = false) {
    // For meeting pk
    // By default only active systems
    const systems = []
    for (const s of speakerSystems.values()) {
      if (s.meeting === pk && (all || s.state === SpeakerSystemState.Active)) {
        systems.push(s)
      }
    }
    return systems
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

  function setActiveList (list: SpeakerList) {
    listChannel.methodCall('set_active', { pk: list.pk })
  }

  return {
    getSystem,
    getSystems,
    getList,
    getQueue,
    getCurrent,
    getAgendaSpeakerLists,
    enterList,
    leaveList,
    startSpeaker,
    stopSpeaker,
    userInList,
    setActiveList
  }
}
