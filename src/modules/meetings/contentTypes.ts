import { MeetingRoles } from '@/composables/types'
import ContentType, { BaseContentType } from '@/contentTypes/ContentType'
import { MeetingAccessPolicy } from '@/contentTypes/types'
import defineChannel from '@/socket/defineChannel'
import { ThemeColor } from '@/utils/types'

import { ElectoralRegister, ErMethod } from './electoralRegisters/types'
import {
  ComponentBase,
  GroupMembership,
  GroupRole,
  IVoteTransfer,
  Meeting,
  MeetingDialectDefinition,
  MeetingGroup,
  MeetingRole,
  MeetingState
} from './types'

export const meetingChannel = defineChannel('meeting')
export const participantChannel = defineChannel('participants', {
  leaveTimeout: 500
})
export const moderatorChannel = defineChannel('moderators', {
  leaveTimeout: 500
})

export const accessPolicyType = new BaseContentType<MeetingAccessPolicy>({
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

export const meetingRoleType = new BaseContentType<MeetingRoles>({
  name: 'meeting_role',
  restEndpoint: 'meeting-roles/'
})

export const meetingType = new ContentType<
  Meeting,
  | 'abort_archiving'
  | 'abort_delete'
  | 'close'
  | 'make_ongoing'
  | 'make_upcoming'
  | 'request_archiving'
  | 'request_delete',
  MeetingRole
>({
  states: {
    name: 'MeetingStateMachine',
    meta: {
      [MeetingState.Upcoming]: {
        icon: 'mdi-progress-clock',
        translate: (t, count = 1) => t('meeting.workflow.upcoming', count)
      },
      [MeetingState.Ongoing]: {
        icon: 'mdi-play-circle',
        translate: (t, count = 1) => t('meeting.workflow.ongoing', count)
      },
      [MeetingState.Closed]: {
        icon: 'mdi-close-circle-outline',
        translate: (t, count = 1) => t('meeting.workflow.closed', count)
      },
      [MeetingState.Archiving]: {
        icon: 'mdi-archive',
        translate: (t, count = 1) => t('meeting.workflow.archiving', count)
      },
      [MeetingState.Archived]: {
        icon: 'mdi-archive',
        translate: (t, count = 1) => t('meeting.workflow.archived', count)
      },
      [MeetingState.Deleting]: {
        color: ThemeColor.Warning,
        icon: 'mdi-delete',
        translate: (t, count = 1) => t('meeting.workflow.deleting', count)
      },
      [MeetingState.Previous]: {
        icon: 'mdi-undo',
        translate: (t, count = 1) => t('meeting.workflow.pre', count)
      }
    }
  },
  name: 'meeting',
  restEndpoint: 'meetings/',
  roles: {
    definitions: {
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
    },
    endpoint: 'meeting-roles/'
  }
})

export const meetingGroupType = new ContentType<MeetingGroup>({
  restEndpoint: 'meeting-groups/',
  name: 'meeting_group'
})

export const meetingComponentType = new ContentType<ComponentBase>({
  restEndpoint: 'meeting-components/',
  name: 'meeting_component'
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
