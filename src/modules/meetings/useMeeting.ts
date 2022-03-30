import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { slugify } from '@/utils'

import useAuthentication from '../../composables/useAuthentication'
import { meetings } from './useMeetings'

import { Meeting, MeetingRole } from './types'
import { canChangeMeeting, canChangeRolesMeeting, canAddMeetingInvite, canViewMeetingInvite } from './rules'
import { meetingType } from './contentTypes'
import { useI18n } from 'vue-i18n'

export default function useMeeting () {
  const route = useRoute()
  const meetingRoles = meetingType.useContextRoles()
  const { user } = useAuthentication()
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
  const isModerator = computed(() => hasRole(MeetingRole.Moderator))
  const canChange = computed(() => canChangeMeeting(meeting.value))
  const canChangeRoles = computed(() => meeting.value && canChangeRolesMeeting(meeting.value))

  return {
    canChange,
    canChangeRoles,
    canAddMeetingInvite: computed(() => meeting.value && canAddMeetingInvite(meeting.value)),
    canViewMeetingInvite: computed(() => meeting.value && canViewMeetingInvite(meeting.value)),
    isModerator,
    meetingId,
    meeting,
    meetingPath,
    roleLabels,
    userRoles,
    getRoleLabels,
    hasRole
  }
}
