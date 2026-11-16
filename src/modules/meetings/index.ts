import { toRef } from 'vue'

import { getApiLink } from '@/utils/restApi'
import { RoleMatrixColumn } from '@/components/types'
import { noValidation, registerValidator } from '@/composables/useStateMachine'

import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import { meetingExportPlugins } from '../exportImport/registry'
import { meetingInviteAnnotationPlugins } from '../meetingInvites/registry'
import { speakerAnnotationRegistry } from '../speakerLists/registry'

import FakeRolesBubble from './FakeRolesBubble.vue'
import { meetingBubblePlugins, meetingRolePlugins } from './registry'
import useGroupStore from './useGroupStore'
import useMeetingGroups from './useMeetingGroups'
import { hasFakeRoles } from './rules'
import { type Meeting, MeetingRole, MeetingState } from './types'

// Register routes
import './router'

function getDownloadFormat(meetingId: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-participants/${meetingId}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'participants',
  getExports(meetingId) {
    return [
      {
        formats: [
          getDownloadFormat(meetingId, 'csv'),
          getDownloadFormat(meetingId, 'json')
        ]
      }
    ]
  },
  getTitle(t) {
    return t('meeting.participantsList')
  }
})

function getGroupDownloadFormat(meetingId: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-meeting-groups/${meetingId}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'meetingGroups',
  checkActive(meeting) {
    return meeting.group_votes_active
  },
  getExports(meetingId) {
    return [
      {
        formats: [
          getGroupDownloadFormat(meetingId, 'csv'),
          getGroupDownloadFormat(meetingId, 'json')
        ]
      }
    ]
  },
  getTitle(t) {
    return t('meeting.groups.groups')
  }
})

function insertAfter(
  columns: RoleMatrixColumn[],
  name: string,
  column: RoleMatrixColumn
) {
  const index =
    columns.findIndex((col) => col.name === name) + 1 || columns.length
  return [...columns.slice(0, index), column, ...columns.slice(index)]
}

/**
 * Add a "voter" column to the role matrix, which shows if the user is in the current electoral register.
 * If the meeting is upcoming, do not add the column.
 * If the meeting has an auto_always electoral register policy, replace the potential voter column with the voter column.
 * Otherwise, insert the voter column after the potential voter column.
 * When auto_always is set and meeting is not ongoing, make the column read-only.
 */
meetingRolePlugins.register({
  contentType: 'meeting',
  id: 'voter',
  transform(columns, meeting) {
    // Not for upcoming meetings
    if (meeting.state === MeetingState.Upcoming) return columns
    const { currentElectoralRegister } = useElectoralRegisters(meeting.pk)

    // Partial column defintion, for updating or inserting with new name
    const columnDefinition: Omit<RoleMatrixColumn, 'name'> = {
      getCount() {
        return currentElectoralRegister.value?.weights.length ?? 0
      },
      getDescription(t) {
        return t('role.help.voter')
      },
      getTitle(t) {
        return t('electoralRegister.inCurrent')
      },
      getValue({ user }) {
        return !!currentElectoralRegister.value?.weights.find(
          (v) => v.user === user
        )
      },
      icon: 'mdi-star'
    }

    /**
     * Return a new column with the given column definition, and the given column's name.
     * If the meeting is not ongoing, make the column read-only.
     */
    function replaceColumn(column: RoleMatrixColumn) {
      if (meeting.state === MeetingState.Ongoing)
        return { ...column, ...columnDefinition }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { setValue, ...readOnlyColumn } = column
      return {
        ...readOnlyColumn,
        ...columnDefinition
      }
    }

    // Replace parts of potential voter column,
    // or insert with new name
    return meeting.er_policy_name === 'auto_always'
      ? columns.map((c) => {
          return c.name === MeetingRole.PotentialVoter ? replaceColumn(c) : c
        })
      : insertAfter(columns, MeetingRole.PotentialVoter, {
          ...columnDefinition,
          name: 'voter'
        })
  }
})

meetingInviteAnnotationPlugins.register({
  id: 'group',
  getPossibleValues(meeting) {
    const { meetingGroups } = useMeetingGroups(toRef(meeting, 'pk'))
    return meetingGroups.value.map((g) => ({
      value: g.groupid,
      description: g.title
    }))
  },
  getTranslator(t, meeting) {
    const { groupRoles } = useMeetingGroups(meeting)
    const { getMeetingGroup } = useGroupStore()
    return (annotation: {
      name: 'group'
      meeting_group: number
      role?: number
    }) => {
      const group = getMeetingGroup(annotation.meeting_group)
      return {
        subtitle: groupRoles.value.find((role) => role.pk === annotation.role)
          ?.title,
        title: `${t('meeting.groups.group')}: ${group?.title || t('unknown')}`
      }
    }
  }
})

meetingInviteAnnotationPlugins.register({
  id: 'grouprole',
  checkActive(meeting) {
    return !!meeting.dialect?.roles?.length
  },
  getPossibleValues(meeting) {
    return (
      meeting.dialect?.roles.map((role) => ({
        value: role.role_id,
        description: role.title
      })) ?? []
    )
  }
})

meetingBubblePlugins.register({
  component: FakeRolesBubble,
  icon: 'mdi-account-hard-hat',
  id: 'fakeRoles',
  checkActive(meeting) {
    return hasFakeRoles(meeting.pk)
  },
  requireAttention: false,
  order: -1
})

speakerAnnotationRegistry.register({
  checkActive() {
    return true
  },
  *iterAnnotations(meeting, user) {
    const groups = useMeetingGroups(meeting).meetingGroups.value.filter(
      (g) => g.show_on_speaker && g.members.includes(user)
    )
    if (!groups.length) return
    yield {
      icon: 'mdi-account-multiple',
      text: groups.map((g) => g.title).join(', ')
    }
  }
})

const MACHINE = 'MeetingStateMachine'
registerValidator(MACHINE, 'has_archive_permission', noValidation)
registerValidator(MACHINE, 'has_delete_permission', noValidation)
registerValidator(MACHINE, 'has_moderate_permission', noValidation)
registerValidator(MACHINE, 'no_ongoing_polls', noValidation)
registerValidator(MACHINE, 'pre_delete_state_is_archived', noValidation)
registerValidator(MACHINE, 'pre_delete_state_is_archiving', noValidation)
registerValidator(MACHINE, 'pre_delete_state_is_closed', noValidation)
registerValidator(MACHINE, 'pre_delete_state_is_ongoing', noValidation)
registerValidator(MACHINE, 'pre_delete_state_is_upcoming', noValidation)
registerValidator(MACHINE, 'valid_er_policy', noValidation)
registerValidator(
  MACHINE,
  'meeting_is_ongoing',
  (meeting: Meeting) =>
    meeting.state === MeetingState.Ongoing || 'Meeting must be ongoing'
)

// Move?
const INVITE_MACHINE = 'InviteStateMachine'
registerValidator(INVITE_MACHINE, 'has_change_permission', noValidation)
