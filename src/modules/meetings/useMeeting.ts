import { Dictionary } from 'lodash'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouteLocationRaw, useRouter } from 'vue-router'

import { slugify } from '@/utils'

import { user } from '@/composables/useAuthentication'

import { meetings, roleIcons, getMeetingRoleIcon } from './useMeetings'
import { Author, MeetingRole } from './types'
import {
  canChangeMeeting,
  canChangeRolesMeeting,
  canAddMeetingInvite,
  canViewMeetingInvite,
  canViewMeeting,
  isModerator,
  isFinishedMeeting,
  isActiveMeeting
} from './rules'
import { meetingType } from './contentTypes'
import { translateMeetingRole } from './utils'
import useMeetingId from './useMeetingId'

const postAsStore = reactive(new Map<number, Author>())

export default function useMeeting() {
  const router = useRouter()
  const meetingRoles = meetingType.useContextRoles()
  const { t } = useI18n()

  const roleItems = computed(() => {
    return Object.values(MeetingRole).map((value) => ({
      value,
      title: translateMeetingRole(value, t)
    }))
  })

  function getRoleLabels(filter: (k: MeetingRole) => boolean = () => true) {
    return Object.fromEntries(
      Object.values(MeetingRole)
        .filter(filter)
        .map((role) => [role, translateMeetingRole(role, t)])
    )
  }

  const roleLabels = computed(() => getRoleLabels())
  const roleLabelsEditable = computed(() =>
    getRoleLabels((role) => !meetingDialect.value?.block_roles?.includes(role))
  )
  const meetingId = useMeetingId()
  const meeting = computed(() => meetings.get(meetingId.value))
  const meetingDialect = computed(() => meeting.value?.dialect)
  const meetingJoinRoute = computed(() => getMeetingRoute('meeting:join'))
  const meetingRoute = computed(() => getMeetingRoute())

  function getUrl(route: RouteLocationRaw) {
    return location.origin + router.resolve(route).href
  }
  const meetingUrl = computed(() => getUrl(meetingRoute.value))
  const meetingJoinUrl = computed(() => getUrl(meetingJoinRoute.value))

  const userRoles = computed(
    () =>
      meetingRoles.getUserRoles(meetingId.value) as Set<MeetingRole> | undefined
  )
  function hasRole(role: MeetingRole, user?: number) {
    return meetingRoles.hasRole(meetingId.value, role, user)
  }

  function getMeetingRoute(
    name: string = 'meeting',
    extraParams?: Dictionary<string | number>
  ) {
    return {
      name,
      params: {
        id: meetingId.value,
        slug: slugify(meeting.value?.title),
        ...extraParams
      }
    }
  }

  /**
   * Remember post_as for this meeting (memory only)
   */
  const postAs = computed({
    get() {
      return (
        postAsStore.get(meetingId.value) ??
        ({ author: user.value?.pk } as Author)
      )
    },
    set(author) {
      postAsStore.set(meetingId.value, author)
    }
  })

  return {
    canChange: computed(() => canChangeMeeting(meeting.value)),
    canChangeRoles: computed(
      () => meeting.value && canChangeRolesMeeting(meeting.value)
    ),
    canAddMeetingInvite: computed(
      () => meeting.value && canAddMeetingInvite(meeting.value)
    ),
    canViewMeeting: computed(() => canViewMeeting(meeting.value)),
    canViewMeetingInvite: computed(
      () => meeting.value && canViewMeetingInvite(meeting.value)
    ),
    isFinishedMeeting: computed(() => isFinishedMeeting(meeting.value)),
    isActiveMeeting: computed(() => isActiveMeeting(meeting.value)),
    isModerator: computed(() => isModerator(meeting.value)),
    meeting,
    meetingId,
    meetingDialect,
    meetingJoinRoute,
    meetingJoinUrl,
    meetingRoute,
    meetingUrl,
    postAs,
    roleIcons,
    roleItems,
    roleLabels,
    roleLabelsEditable,
    userRoles,
    getMeetingRoleIcon,
    getMeetingRoute,
    getRoleLabels,
    hasRole
  }
}
