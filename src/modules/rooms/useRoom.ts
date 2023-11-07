import { computed } from 'vue'
import { useRoute } from 'vue-router'

import useChannel from '@/composables/useChannel'
import { user } from '@/composables/useAuthentication'
import { getProposals } from '../proposals/useProposals'

import { highlightedStore, meetingRoomStore } from './useRooms'
import { roomType } from './contentTypes'

export default function useRoom() {
  const route = useRoute()
  const roomId = computed(() => Number(route.params.roomId))
  useChannel('room', roomId)

  const meetingRoom = computed(() => meetingRoomStore.get(roomId.value))
  const highlighted = computed(
    () => highlightedStore.get(roomId.value)?.highlighted ?? []
  )
  const highlightedProposals = computed(() => getProposals(highlighted.value))

  const isBroadcasting = computed(() => {
    if (!meetingRoom.value) return false
    return (
      meetingRoom.value.open &&
      meetingRoom.value.send_proposals &&
      meetingRoom.value.handler === user.value?.pk
    )
  })

  async function setAgendaId(aid: number) {
    await roomType.update(roomId.value, { agenda_item: aid })
  }

  async function setOpen(open: boolean) {
    await roomType.update(roomId.value, { open })
  }

  async function setBroadcast(content?: {
    agenda_item: number
    proposals: number[]
  }) {
    if (!user.value) throw new Error('No authenticated user')
    await roomType.update(roomId.value, {
      handler: user.value.pk,
      open: true,
      send_proposals: true,
      ...content
    })
  }

  async function setProposalBroadcast(active = true) {
    await roomType.update(roomId.value, { send_proposals: active })
  }

  async function setSlsBroadcast(active = true) {
    await roomType.update(roomId.value, { send_sls: active })
  }

  async function setHighlightedProposals(proposalIds: number[]) {
    await roomType.update(roomId.value, { highlighted: proposalIds } as any)
  }

  return {
    highlighted,
    highlightedProposals,
    isBroadcasting,
    meetingRoom,
    roomId,
    setAgendaId,
    setBroadcast,
    setOpen,
    setProposalBroadcast,
    setSlsBroadcast,
    setHighlightedProposals
  }
}
