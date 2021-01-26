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
    console.log('updated speaker list order', pk, current, queue)
    speakerQueues.value.set(pk, queue)
    currentlySpeaking.value.set(pk, current)
  })

export default function useSpeakerLists () {
  const { user } = useAuthentication()

  function getAgendaSpeakerLists (agendaPk) {
    return [...wu(speakerLists.value.values()).filter(l => l.agenda_item === agendaPk)]
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

  return {
    speakerSystems,
    speakerLists,
    speakerQueues,
    currentlySpeaking,
    getAgendaSpeakerLists,
    enterList,
    leaveList,
    userInList
  }
}
