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
    const { active, handler } = meetingRoom.value
    return active && handler === user.value?.pk
  })

  async function setAgendaId(aid: number) {
    await roomType.update(roomId.value, { agenda_item: aid })
  }

  async function setBroadcast(
    active = true,
    content?: { agenda_item: number; proposals: number[] }
  ) {
    if (!user.value) throw new Error('No authenticated user')
    const handler = active ? user.value.pk : undefined
    await roomType.update(roomId.value, { active, handler, ...content })
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
    setProposalBroadcast,
    setSlsBroadcast,
    setHighlightedProposals
  }
}
