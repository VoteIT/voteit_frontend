import { reactive } from 'vue'
import wu from 'wu'

import speakerListType from '@/contentTypes/speakerList'
import speakerSystemType from '@/contentTypes/speakerSystem'

import useAuthentication from '../useAuthentication'

import { SpeakerList, SpeakerOrderUpdate, SpeakerSystem } from '@/contentTypes/types'

const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
const currentlySpeaking = reactive<Map<number, number>>(new Map()) // Map list pk to a user pk
const speakerQueues = reactive<Map<number, number[]>>(new Map()) // Map list pk to a list of user pks

speakerSystemType.useChannels()
  .updateMap(speakerSystems)

const listChannel = speakerListType.useChannels()
  .updateMap(speakerLists)
  .on('order', (order: any) => {
    const { pk, queue, current } = order as SpeakerOrderUpdate
    speakerQueues.set(pk, queue)
    currentlySpeaking.set(pk, current)
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
      if (s.meeting === pk && (all || s.active)) {
        systems.push(s)
      }
    }
    return systems
  }

  function getList (pk: number) {
    return speakerLists.get(pk)
  }
  function getQueue (pk: number) {
    return speakerQueues.get(pk) || []
  }
  function getCurrent (pk: number) {
    return currentlySpeaking.get(pk)
  }

  function enterList (pk: number) {
    return listChannel.methodCall('enter', { pk })
  }
  function leaveList (pk: number) {
    return listChannel.methodCall('leave', { pk })
  }
  function userInList (pk: number) {
    const queue = speakerQueues.get(pk)
    return queue && queue.includes(user.value.pk)
  }

  function startSpeaker (pk: number, userid: number) {
    userid = userid || getQueue(pk)[0]
    listChannel.methodCall('start_user', {
      pk,
      userid
    })
  }

  function stopSpeaker (pk: number) {
    listChannel.methodCall('stop_user', {
      pk,
      userid: getCurrent(pk)
    })
  }

  function setActiveList (pk: number) {
    listChannel.methodCall('set_active', { pk })
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
