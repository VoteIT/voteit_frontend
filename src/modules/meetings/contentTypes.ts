import { MeetingRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import { ElectoralRegister, MeetingAccessPolicy } from '@/contentTypes/types'
import { Meeting, MeetingGroup, MeetingInvite, MeetingRole } from './types'
import { meetingStates } from './workflowStates'

export const accessPolicyType = new ContentType<MeetingAccessPolicy>({
  name: 'access_policy',
  restEndpoint: 'access-policies/'
})

export const electoralRegisterType = new ContentType<ElectoralRegister>({
  name: 'electoral_register',
  restEndpoint: 'electoral-registers/'
})

export const meetingRoleType = new ContentType<MeetingRoles>({
  name: 'meeting_role',
  restEndpoint: 'meeting-roles/'
})

export const meetingType = new ContentType<Meeting, MeetingRole>({
  states: meetingStates,
  name: 'meeting',
  channels: ['meeting', 'participants', 'moderators', 'invites'],
  restEndpoint: 'meetings/',
  hasRoles: true,
  dateFields: ['start_time', 'end_time']
})

export const meetingInviteType = new ContentType<MeetingInvite>({
  name: 'meeting_invite',
  restEndpoint: 'handle-matched-invites/'
})

export const meetingGroupType = new ContentType<MeetingGroup>({
  restEndpoint: 'meeting-groups/',
  name: 'meeting_group',
  dateFields: ['created', 'modified']
})
