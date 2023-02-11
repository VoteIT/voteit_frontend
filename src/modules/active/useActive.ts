import { computed, reactive, Ref } from 'vue'

import { user } from '@/composables/useAuthentication'
import { activeUserType } from './contentTypes'
import { meetingType } from '../meetings/contentTypes'
import { NoSettingsComponent } from '../meetings/types'
import useMeetingComponents from '../meetings/useMeetingComponent'

// FIXME Drop this
const MEETING_ID = 103

interface ActiveUsersMsg {
  // meeting: number
  users: number[]
}

const meetingActiveUsers = reactive(new Map<number, number[]>())
activeUserType
  .on<ActiveUsersMsg>('all', msg => {
    // FIXME get meeting
    meetingActiveUsers.set(MEETING_ID, msg.users)
  })
  .onChanged(msg => {
    const active = meetingActiveUsers.get(MEETING_ID) || []
    meetingActiveUsers.set(
      MEETING_ID,
      msg.active
        ? [...active, msg.user]
        : active.filter(pk => pk !== msg.user)
    )
  })

function uriToNumber (uri: string | number) {
  if (typeof uri === 'number') return uri
  return Number(uri.split('/')[1])
}

// Drop list of active users when leaving meeting
meetingType.channel.onLeave(uri => {
  meetingActiveUsers.delete(uriToNumber(uri))
})

export default function useActive (meetingId: Ref<number>) {
  const { componentActive } = useMeetingComponents<NoSettingsComponent<'active_users'>>(meetingId, 'active_users')

  const isActive = computed({
    get () {
      if (!user.value) return false
      return !!meetingActiveUsers.get(meetingId.value)?.includes(user.value.pk)
    },
    set (value) {
      setActive(value)
    }
  })

  async function setActive (active: boolean) {
    if (!user.value) throw new Error('Must have authenticated user to set active')
    await activeUserType.methodCall('set', {
      active,
      meeting: meetingId.value,
      user: user.value.pk
    })
  }

  return {
    activeUserIds: computed(() => meetingActiveUsers.get(meetingId.value) || []),
    componentActive,
    isActive,
    setActive
  }
}
