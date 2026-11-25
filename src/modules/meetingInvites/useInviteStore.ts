import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

import { matchedInviteType, meetingInviteType } from './contentTypes'
import { MeetingInvite, MeetingInviteState } from './types'

export default defineStore('invites', () => {
  /** Open invites the current user can accept */
  const matchedInvites = shallowRef<MeetingInvite[]>([])
  /** Invites matching the user that another account already accepted */
  const usedInvites = shallowRef<MeetingInvite[]>([])
  const meetingInvites = shallowReactive(new Map<number, MeetingInvite>())

  meetingInviteType.updateMap(meetingInvites)

  function clearMatchedInvites() {
    matchedInvites.value = []
    usedInvites.value = []
  }

  async function fetchMatchedInvites() {
    const data = await matchedInviteType.api.list({ include_used: 1 })
    // During update downtime server will send a non-JSON-response for a short time. Throw an error if that happens.
    if (!Array.isArray(data))
      throw new Error('Bad response for matched invites')
    matchedInvites.value = data.filter(
      (inv) => inv.state === MeetingInviteState.Open
    )
    usedInvites.value = data.filter((inv) => inv.used_elsewhere)
  }

  function bulkDelete(meeting: number, invites: number[]) {
    return meetingInviteType.api.listAction('bulk-delete', { invites, meeting })
  }

  function bulkRevoke(meeting: number, invites: number[]) {
    return meetingInviteType.api.listAction('bulk-revoke', { invites, meeting })
  }

  return {
    matchedInvites,
    meetingInvites,
    usedInvites,
    bulkDelete,
    bulkRevoke,
    clearMatchedInvites,
    fetchMatchedInvites
  }
})
