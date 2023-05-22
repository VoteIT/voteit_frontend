import { toRef } from 'vue'
import { RoleMatrixColumn } from '@/components/types'
import { getApiLink } from '@/utils/restApi'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'

import { MeetingInviteAnnotationPlugin, meetingExportPlugins, meetingInviteAnnotationPlugins, meetingRolePlugins } from './registry'
import useMeetingGroups from './useMeetingGroups'

function getDownloadFormat (meetingId: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-participants/${meetingId}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'participants',
  getExports (t, meetingId) {
    return [{
      formats: [
        getDownloadFormat(meetingId, 'csv'),
        getDownloadFormat(meetingId, 'json')
      ]
    }]
  },
  getTitle (t) {
    return t('meeting.participantsList')
  }
})

function getGroupDownloadFormat (meetingId: number, format: 'csv' | 'json') {
  return {
    format,
    url: getApiLink(`export-meeting-groups/${meetingId}/${format}/`)
  }
}

meetingExportPlugins.register({
  id: 'meetingGroups',
  checkActive (meeting) {
    return meeting.group_votes_active
  },
  getExports (t, meetingId) {
    return [{
      formats: [
        getGroupDownloadFormat(meetingId, 'csv'),
        getGroupDownloadFormat(meetingId, 'json')
      ]
    }]
  },
  getTitle (t) {
    return t('meeting.groups.groups')
  }
})

function insertAfter (columns: RoleMatrixColumn[], name: string, column: RoleMatrixColumn) {
  const index = (columns.findIndex(col => col.name === name) + 1) || columns.length
  return [
    ...columns.slice(0, index),
    column,
    ...columns.slice(index)
  ]
}

meetingRolePlugins.register({
  contentType: 'meeting',
  id: 'voter',
  transform (columns, meeting) {
    const { currentElectoralRegister } = useElectoralRegisters(toRef(meeting, 'pk'))

    // Partial column defintion, for updating or inserting with new name
    const columnDefinition: Omit<RoleMatrixColumn, 'name'> = {
      getCount () {
        return currentElectoralRegister.value?.weights.length ?? 0
      },
      getDescription (t) {
        return t('role.help.voter')
      },
      getTitle (t) {
        return t('electoralRegister.inCurrent')
      },
      getValue ({ user }) {
        return !!currentElectoralRegister.value?.weights.find(v => v.user === user)
      },
      icon: 'mdi-star'
    }

    return meeting.er_policy_name === 'auto_always'
      // Replace parts of potential_voter column
      ? columns.map(c => {
        return c.name === 'potential_voter'
          ? { ...c, ...columnDefinition }
          : c
      })
      // Insert with new name
      : insertAfter(columns, 'potential_voter', {
        ...columnDefinition,
        name: 'voter'
      })
  }
})

meetingInviteAnnotationPlugins.register({
  id: 'group',
  getTranslator (t, meeting) {
    const { getMeetingGroup, groupRoles } = useMeetingGroups(meeting)
    return (annotation: { name: 'group', meeting_group: number, role?: number }) => {
      const group = getMeetingGroup(annotation.meeting_group)
      return {
        subtitle: groupRoles.value.find(role => role.pk === annotation.role)?.title,
        title: `${t('meeting.groups.group')}: ${group?.title || t('unknown')}`
      }
    }
  }
} as MeetingInviteAnnotationPlugin)
