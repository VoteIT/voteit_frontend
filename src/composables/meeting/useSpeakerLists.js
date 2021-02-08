import { ref } from 'vue'
import wu from 'wu'

import useAuthentication from '../useAuthentication'
import useChannels from '../useChannels'

const speakerSystems = ref(new Map())
const speakerLists = ref(new Map())
const currentlySpeaking = ref(new Map()) // Map list pk to a user pk
const speakerQueues = ref(new Map()) // Map list pk to a list of user pks

useChannels('speaker_system')
  .updateMap(speakerSystems.value)

const listChannel = useChannels('speaker_list')
  .updateMap(speakerLists.value)
  .on('order', ({ pk, queue, current }) => { // pk == Speaker list pk
    speakerQueues.value.set(pk, queue)
    currentlySpeaking.value.set(pk, current)
  })

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaPk) {
    return [...wu(speakerLists.value.values()).filter(l => l.agenda_item === agendaPk)]
  }

  function getSystem (pk) {
    return speakerSystems.value.get(pk)
  }

  function getSystems (pk, all = false) {
    // For meeting pk
    // By default only active systems
    const systems = []
    for (const s of speakerSystems.value.values()) {
      if (s.meeting === pk && (all || s.active)) {
        systems.push(s)
      }
    }
    return systems
  }

  function getList (pk) {
    return speakerLists.value.get(pk)
  }
  function getQueue (pk) {
    return speakerQueues.value.get(pk) || []
  }
  function getCurrent (pk) {
    return currentlySpeaking.value.get(pk)
  }

  function enterList (pk) {
    return listChannel.methodCall('enter', { pk })
  }
  function leaveList (pk) {
    return listChannel.methodCall('leave', { pk })
  }
  function userInList (pk) {
    const queue = speakerQueues.value.get(pk)
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
