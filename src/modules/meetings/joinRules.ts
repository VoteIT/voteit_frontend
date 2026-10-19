import { AccessPolicy } from '@/contentTypes/types'
import { isApiError } from '@/utils/restApi'

import useAuthStore from '../auth/useAuthStore'
import { MeetingInvite } from '../meetingInvites/types'
import useInviteStore from '../meetingInvites/useInviteStore'

import { accessPolicyType } from './contentTypes'
import { canBecomeModerator } from './rules'

interface JoinOptions {
  invites: MeetingInvite[]
  policies: AccessPolicy[]
}

/**
 * Whether the user has a way into a meeting they hold no role in: managing the
 * organisation, an invitation, or an active access policy. Any of these is a
 * way in even to a meeting the server won't show us yet.
 */
export function canJoinMeeting(
  meeting: number,
  { invites, policies }: JoinOptions
): boolean {
  return (
    canBecomeModerator() ||
    invites.some((inv) => inv.meeting === meeting) ||
    policies.some((policy) => policy.active)
  )
}

/** Active policies for a meeting. None found means none we can use. */
async function fetchPolicies(meeting: number): Promise<AccessPolicy[]> {
  try {
    return (await accessPolicyType.api.retrieve(meeting)).policies
  } catch (e) {
    if (!isApiError(e) || e.status !== 404) console.warn(e)
    return []
  }
}

/**
 * `canJoinMeeting`, for when nothing has been fetched yet - loading a meeting
 * the server refused us, say. Asks only as much as it has to, cheapest first.
 *
 * Resolves to undefined when there's no way in, otherwise to what is known
 * about the meeting - an invitation may carry the title we can't fetch.
 * Failures count as no way in, leaving the caller to do what it would have
 * done anyway.
 */
export async function checkCanJoinMeeting(
  meeting: number
): Promise<{ title?: string } | undefined> {
  if (!useAuthStore().user) return
  if (canBecomeModerator()) return {}

  const inviteStore = useInviteStore()
  try {
    await inviteStore.fetchMatchedInvites()
  } catch (e) {
    console.warn(e)
  }
  const invites = inviteStore.matchedInvites.filter(
    (inv) => inv.meeting === meeting
  )
  if (invites.length) return { title: invites[0].meeting_title }

  const policies = await fetchPolicies(meeting)
  if (canJoinMeeting(meeting, { invites, policies })) return {}
}
