import { Dictionary } from 'lodash'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { slugify } from '@/utils'

import { meetings } from './useMeetings'

import { Meeting, MeetingRole } from './types'
import { canChangeMeeting, canChangeRolesMeeting, canAddMeetingInvite, canViewMeetingInvite, canViewMeeting, isModerator, isFinishedMeeting } from './rules'
import { meetingType } from './contentTypes'
import { useI18n } from 'vue-i18n'

export default function useMeeting () {
  const route = useRoute()
  const meetingRoles = meetingType.useContextRoles()
  const { t } = useI18n()

  const roleItems = computed(() => {
    return Object.values(MeetingRole)
      .map(value => ({
        value,
        title: t(`role.${value}`)
      }))
  })

  function getRoleLabels (filter: (k: MeetingRole) => boolean = () => true) {
    return Object.fromEntries(
      Object.values(MeetingRole)
        .filter(filter)
        .map(role => [role, t(`role.${role}`)])
    )
  }

  const roleLabels = computed(() => getRoleLabels())
  const roleLabelsEditable = computed(() => getRoleLabels(role => !meetingDialect.value?.block_roles?.includes(role)))
  const meetingId = computed(() => Number(route.params.id))
  const meeting = computed<Meeting | undefined>(() => meetings.get(meetingId.value))
  const meetingDialect = computed(() => meeting.value?.dialect)
  const meetingJoinPath = computed(() => `/join/${meetingId.value}/${slugify(meeting.value?.title ?? '-')}`)
  const meetingPath = computed(() => `/m/${meetingId.value}/${slugify(meeting.value ? meeting.value.title : '-')}`)
  const meetingUrl = computed(() => `${location.origin}${meetingPath.value}`)

  const userRoles = computed(() => meetingRoles.getUserRoles(meetingId.value))
  function hasRole (role: MeetingRole, user?: number) {
    return meetingRoles.hasRole(meetingId.value, role, user)
  }

  function getMeetingRoute (name: string, extraParams?: Dictionary<string | number>) {
    return {
      name,
      params: {
        id: meetingId.value,
        slug: slugify(meeting.value?.title ?? '-'),
        ...extraParams
      }
    }
  }

  return {
    canChange: computed(() => canChangeMeeting(meeting.value)),
    canChangeRoles: computed(() => meeting.value && canChangeRolesMeeting(meeting.value)),
    canAddMeetingInvite: computed(() => meeting.value && canAddMeetingInvite(meeting.value)),
    canViewMeeting: computed(() => canViewMeeting(meeting.value)),
    canViewMeetingInvite: computed(() => meeting.value && canViewMeetingInvite(meeting.value)),
    isFinishedMeeting: computed(() => isFinishedMeeting(meeting.value)),
    isModerator: computed(() => isModerator(meeting.value)),
    meeting,
    meetingId,
    meetingDialect,
    meetingJoinPath,
    meetingPath,
    meetingUrl,
    roleItems,
    roleLabels,
    roleLabelsEditable,
    userRoles,
    getMeetingRoute,
    getRoleLabels,
    hasRole
  }
}
