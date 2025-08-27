import { ref } from 'vue'

import { matchedInviteType } from './contentTypes'
import { MeetingInvite } from './types'

const matchedInvites = ref<MeetingInvite[]>([])

async function fetchInvites() {
  const { data } = await matchedInviteType.api.list()
  // During update downtime server will send a non-JSON-response for a short time. Throw an error if that happens.
  if (!Array.isArray(data)) throw new Error('Bad response for matched invites')
  matchedInvites.value = data
}

function clearInvites() {
  matchedInvites.value = []
}

/** Matched invites for user from rest API */
export default function useMatchedInvites() {
  return {
    matchedInvites,
    clearInvites,
    fetchInvites
  }
}
