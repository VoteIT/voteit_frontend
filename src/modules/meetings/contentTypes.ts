import { MeetingRoles } from '@/composables/types'
import ContentType from '@/contentTypes/ContentType'
import { ElectoralRegister, MeetingAccessPolicy } from '@/contentTypes/types'
import { Meeting, MeetingInvite, MeetingRole } from './types'
import { meetingStates } from './workflowStates'

export const meetingInviteType = new ContentType<MeetingInvite>({
  restEndpoint: 'handle-matched-invites/'
})

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
