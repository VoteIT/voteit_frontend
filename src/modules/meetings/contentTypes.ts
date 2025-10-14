import { MeetingRoles } from '@/composables/types'
import ContentType, { BaseContentType } from '@/contentTypes/ContentType'
import { ExtractTransition, MeetingAccessPolicy } from '@/contentTypes/types'
import { ElectoralRegister, ErMethod } from './electoralRegisters/types'
import {
  ComponentBase,
  GroupMembership,
  GroupRole,
  IVoteTransfer,
  Meeting,
  MeetingDialectDefinition,
  MeetingGroup,
  MeetingRole
} from './types'
import { meetingComponentStates, meetingStates } from './workflowStates'

export const accessPolicyType = new ContentType<MeetingAccessPolicy>({
  name: 'access_policy',
  restEndpoint: 'access-policies/'
})

export const electoralRegisterType = new ContentType<ElectoralRegister>({
  name: 'er',
  restEndpoint: 'electoral-registers/'
})

export const erMethodType = new BaseContentType<ErMethod>({
  name: 'er-policy',
  restEndpoint: 'electoral-register-policies/'
})

export const meetingRoleType = new ContentType<MeetingRoles>({
  name: 'meeting_role',
  restEndpoint: 'meeting-roles/'
})

export const meetingType = new ContentType<
  Meeting,
  ExtractTransition<typeof meetingStates>,
  MeetingRole
>({
  states: meetingStates,
  name: 'meeting',
  channels: ['meeting', 'participants', 'moderators', 'invites'],
  restEndpoint: 'meetings/',
  restConfig: { alertOnError: false },
  roles: {
    [MeetingRole.Participant]: {
      translateHelp: (t) => t('role.help.participant'),
      translateName: (t) => t('role.participant')
    },
    [MeetingRole.Discusser]: {
      translateHelp: (t) => t('role.help.discusser'),
      translateName: (t) => t('role.discusser')
    },
    [MeetingRole.Moderator]: {
      translateHelp: (t) => t('role.help.moderator'),
      translateName: (t) => t('role.moderator')
    },
    [MeetingRole.PotentialVoter]: {
      translateHelp: (t) => t('role.help.potential_voter'),
      translateName: (t) => t('role.potential_voter')
    },
    [MeetingRole.Proposer]: {
      translateHelp: (t) => t('role.help.proposer'),
      translateName: (t) => t('role.proposer')
    }
  }
})

export const meetingGroupType = new ContentType<MeetingGroup>({
  restEndpoint: 'meeting-groups/',
  name: 'meeting_group',
  restConfig: { alertOnError: false }
})

export const meetingComponentType = new ContentType<
  ComponentBase,
  ExtractTransition<typeof meetingComponentStates>
>({
  restEndpoint: 'meeting-components/',
  name: 'meeting_component',
  states: meetingComponentStates
})

export const groupRoleType = new ContentType<GroupRole>({
  name: 'group_role'
})

export const groupMembershipType = new ContentType<GroupMembership>({
  name: 'group_membership',
  restEndpoint: 'group-memberships/'
})

export const meetingDialectType = new BaseContentType<MeetingDialectDefinition>(
  {
    name: 'meeting_dialect',
    restEndpoint: 'meeting-dialects/'
  }
)

export const voteTransferType = new ContentType<IVoteTransfer>({
  name: 'vt',
  restEndpoint: 'vote-transfer/'
})
