import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

import { matchedInviteType, meetingInviteType } from './contentTypes'
import { MeetingInvite } from './types'

export default defineStore('inviteStore', () => {
  const matchedInvites = shallowRef<MeetingInvite[]>([])
  const meetingInvites = shallowReactive<Map<number, MeetingInvite>>(new Map())

  meetingInviteType.updateMap(meetingInvites)

  function clearMatchedInvites() {
    matchedInvites.value = []
  }

  async function fetchMatchedInvites() {
    const { data } = await matchedInviteType.api.list()
    // During update downtime server will send a non-JSON-response for a short time. Throw an error if that happens.
    if (!Array.isArray(data))
      throw new Error('Bad response for matched invites')
    matchedInvites.value = data
  }

  return {
    matchedInvites,
    meetingInvites,
    clearMatchedInvites,
    fetchMatchedInvites
  }
})
