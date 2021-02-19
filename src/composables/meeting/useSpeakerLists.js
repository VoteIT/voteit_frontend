import { reactive } from 'vue'
import wu from 'wu'

import speakerListType from '@/contentTypes/speakerList'
import speakerSystemType from '@/contentTypes/speakerSystem'

import useAuthentication from '../useAuthentication'

const speakerSystems = reactive(new Map())
const speakerLists = reactive(new Map())
const currentlySpeaking = reactive(new Map()) // Map list pk to a user pk
const speakerQueues = reactive(new Map()) // Map list pk to a list of user pks

speakerSystemType.useChannels()
  .updateMap(speakerSystems)

const listChannel = speakerListType.useChannels()
  .updateMap(speakerLists)
  .on('order', ({ pk, queue, current }) => { // pk == Speaker list pk
    speakerQueues.set(pk, queue)
    currentlySpeaking.set(pk, current)
  })

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaPk) {
    return [...wu(speakerLists.values()).filter(l => l.agenda_item === agendaPk)]
  }

  function getSystem (pk) {
    return speakerSystems.get(pk)
  }

  function getSystems (pk, all = false) {
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

  function getList (pk) {
    return speakerLists.get(pk)
  }
  function getQueue (pk) {
    return speakerQueues.get(pk) || []
  }
  function getCurrent (pk) {
    return currentlySpeaking.get(pk)
  }

  function enterList (pk) {
    return listChannel.methodCall('enter', { pk })
  }
  function leaveList (pk) {
    return listChannel.methodCall('leave', { pk })
  }
  function userInList (pk) {
    const queue = speakerQueues.get(pk)
    return queue && queue.includes(user.value.pk)
  }

  function startSpeaker (pk, userid) {
    userid = userid || getQueue(pk)[0]
    listChannel.methodCall('start_user', {
      pk,
      userid
    })
  }

  function stopSpeaker (pk) {
    listChannel.methodCall('stop_user', {
      pk,
      userid: getCurrent(pk)
    })
  }

  function setActiveList (pk) {
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
