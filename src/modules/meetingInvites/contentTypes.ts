import ContentType from '@/contentTypes/ContentType'
import { MeetingInvite } from './types'
import { ExtractTransition } from '@/contentTypes/types'
import { meetingInviteStates } from './workflowStates'

export const matchedInviteType = new ContentType<MeetingInvite>({
  name: 'meeting_invite',
  restEndpoint: 'handle-matched-invites/'
})

export const meetingInviteType = new ContentType<
  MeetingInvite,
  ExtractTransition<typeof meetingInviteStates>
>({
  name: 'meeting_invite',
  restEndpoint: 'meeting-invites/',
  states: meetingInviteStates
})
