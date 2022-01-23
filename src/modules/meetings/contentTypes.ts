import { MeetingRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import { ElectoralRegister, MeetingAccessPolicy } from '@/contentTypes/types'
import { Meeting, MeetingGroup, MeetingInvite, MeetingRole } from './types'
import { meetingStates } from './workflowStates'

export const accessPolicyType = new ContentType<MeetingAccessPolicy>({
  restEndpoint: 'access-policies/'
})

export const electoralRegisterType = new ContentType<ElectoralRegister>({
  restEndpoint: 'electoral-registers/'
})

export const meetingRoleType = new ContentType<MeetingRoles>({
  restEndpoint: 'meeting-roles/'
})

export const meetingType = new ContentType<Meeting, MeetingRole>({
  states: meetingStates,
  channelName: 'meeting',
  restEndpoint: 'meetings/',
  hasRoles: true,
  dateFields: ['start_time', 'end_time']
})

export const meetingInviteType = new ContentType<MeetingInvite>({
  channelName: 'invites', // TODO There aren't really channels for invites. Set this up in a future useChannel('invites') for subscribing.
  restEndpoint: 'handle-matched-invites/'
})

export const meetingGroupType = new ContentType<MeetingGroup>({
  restEndpoint: 'meeting-groups/',
  channelName: 'meeting_group',
  dateFields: ['created', 'modified']
})
