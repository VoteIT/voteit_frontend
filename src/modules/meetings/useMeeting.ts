import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { slugify } from '@/utils'

import { meetings } from './useMeetings'

import { Meeting, MeetingRole } from './types'
import { canChangeMeeting, canChangeRolesMeeting, canAddMeetingInvite, canViewMeetingInvite, canViewMeeting, isModerator } from './rules'
import { meetingType } from './contentTypes'
import { useI18n } from 'vue-i18n'

export default function useMeeting () {
  const route = useRoute()
  const meetingRoles = meetingType.useContextRoles()
  const { t } = useI18n()

  function getRoleLabels (filter: (k: string) => boolean = () => true) {
    return Object.fromEntries(
      Object.values(MeetingRole)
        .filter(filter)
        .map(role => [role, t(`role.${role}`)])
    )
  }

  const roleLabels = computed(() => getRoleLabels())

  const meetingId = computed(() => Number(route.params.id))
  const meeting = computed<Meeting | undefined>(() => meetings.get(meetingId.value)) // Disable fallback || {})
  const meetingPath = computed(() => `/m/${meetingId.value}/${slugify(meeting.value ? meeting.value.title : '-')}`)

  const userRoles = computed(() => meetingRoles.getUserRoles(meetingId.value))
  function hasRole (role: MeetingRole, user?: number) {
    return meetingRoles.hasRole(meetingId.value, role, user)
  }

  return {
    canChange: computed(() => canChangeMeeting(meeting.value)),
    canChangeRoles: computed(() => meeting.value && canChangeRolesMeeting(meeting.value)),
    canAddMeetingInvite: computed(() => meeting.value && canAddMeetingInvite(meeting.value)),
    canViewMeeting: computed(() => canViewMeeting(meeting.value)),
    canViewMeetingInvite: computed(() => meeting.value && canViewMeetingInvite(meeting.value)),
    isModerator: computed(() => isModerator(meeting.value)),
    meetingId,
    meeting,
    meetingPath,
    roleLabels,
    userRoles,
    getRoleLabels,
    hasRole
  }
}
