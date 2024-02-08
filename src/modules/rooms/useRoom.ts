import { computed } from 'vue'
import { useRoute } from 'vue-router'

import useChannel from '@/composables/useChannel'
import { user } from '@/composables/useAuthentication'
import { getProposals } from '../proposals/useProposals'
import { findSpeakerSystem } from '../speakerLists/useSpeakerLists'

import { highlightedStore, meetingRoomStore } from './useRooms'
import { roomType } from './contentTypes'
import { isEqual } from 'lodash'
import usePoll from '../polls/usePoll'
import { useStorage } from '@vueuse/core'
import { SpeakerSystemState } from '../speakerLists/types'

const textSize = useStorage<'normal' | 'large' | 'x-large'>(
  'room.textSize',
  'normal'
)

export default function useRoom() {
  const route = useRoute()
  const roomId = computed(() => Number(route.params.roomId))
  useChannel('room', roomId)

  const meetingRoom = computed(() => meetingRoomStore.get(roomId.value))
  const highlighted = computed(
    () => highlightedStore.get(roomId.value)?.highlighted
  )
  const highlightedProposals = computed(() =>
    highlighted.value ? getProposals(highlighted.value) : []
  )

  /**
   * Is anyone broadcasting?
   */
  const hasBroadcast = computed(() => {
    if (!meetingRoom.value) return false
    return meetingRoom.value.open && meetingRoom.value.send_proposals
  })

  /**
   * Is current user broadcasting?
   */
  const isBroadcasting = computed(() => {
    if (!meetingRoom.value) return false
    return hasBroadcast.value && meetingRoom.value.handler === user.value?.pk
  })

  /**
   * Use this to react and open selected poll in real-time view.
   */
  const { poll: roomOpenPoll } = usePoll(
    computed(() => meetingRoom.value?.poll ?? 0)
  )

  /**
   * Set broadcasted poll. Should always be called when starting poll in plenary view.
   */
  function setPoll(poll: number | null) {
    return roomType.api.action(roomId.value, 'handle', { poll }, 'patch')
  }

  async function setOpen(open: boolean) {
    await roomType.update(roomId.value, { open })
  }

  function setShowBallot(show_ballot: boolean) {
    return roomType.update(roomId.value, { show_ballot })
  }

  async function setBroadcast(content?: {
    agenda_item?: number
    highlighted: number[]
  }) {
    if (!user.value)
      throw new Error(
        'No authenticated user available when trying to set broadcast'
      )
    if (!meetingRoom.value)
      throw new Error(
        `No meeting room data available for room ${roomId.value} when trying to set broadcast`
      )
    const { handler, open, send_proposals } = meetingRoom.value
    // Make sure broadcast is on
    if (!open || !send_proposals)
      await roomType.update(roomId.value, {
        open: true,
        send_proposals: true
      })
    // Make sure user is handler
    if (handler !== user.value?.pk) await setHandler()
    // Set content
    if (content)
      await roomType.api.action(roomId.value, 'handle', content, 'patch')
  }

  /**
   * Sets current user as handler.
   */
  function setHandler() {
    return roomType.api.action(roomId.value, 'set-handler')
  }

  async function setProposalBroadcast(active = true) {
    await roomType.update(roomId.value, { send_proposals: active })
  }

  async function setSlsBroadcast(active = true) {
    await roomType.update(roomId.value, { send_sls: active })
  }

  async function setHighlightedProposals(proposalIds: number[]) {
    if (isEqual(proposalIds, highlighted.value)) return
    await roomType.api.action(
      roomId.value,
      'handle',
      { highlighted: proposalIds },
      'patch'
    )
  }

  const speakerSystem = computed(() =>
    findSpeakerSystem((s) => s.room === roomId.value)
  )
  const hasSpeakerLists = computed(
    () => speakerSystem.value?.state === SpeakerSystemState.Active
  )

  return {
    hasBroadcast,
    hasSpeakerLists,
    highlighted,
    highlightedProposals,
    isBroadcasting,
    meetingRoom,
    roomId,
    roomOpenPoll,
    speakerSystem,
    textSize,
    setBroadcast,
    setHandler,
    setOpen,
    setPoll,
    setProposalBroadcast,
    setSlsBroadcast,
    setShowBallot,
    setHighlightedProposals
  }
}
