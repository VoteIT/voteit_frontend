import { computed, reactive, Ref } from 'vue'

import { user } from '@/composables/useAuthentication'
import { activeUserType } from './contentTypes'
import { meetingType } from '../meetings/contentTypes'
import { NoSettingsComponent } from '../meetings/types'
import useMeetingComponents from '../meetings/useMeetingComponent'

interface ActiveUsersMsg {
  meeting: number
  users: number[]
}

const meetingActiveUsers = reactive(new Map<number, number[]>())
activeUserType
  .on<ActiveUsersMsg>('all', (msg) => {
    // FIXME get meeting
    meetingActiveUsers.set(msg.meeting, msg.users)
  })
  .onChanged((msg) => {
    const active = meetingActiveUsers.get(msg.meeting) || []
    meetingActiveUsers.set(
      msg.meeting,
      msg.active
        ? [...active, msg.user]
        : active.filter((pk) => pk !== msg.user)
    )
  })

// Drop list of active users when leaving meeting
meetingType.channel.onLeave((pk) => {
  meetingActiveUsers.delete(pk)
})

export default function useActive(meetingId: Ref<number>) {
  const { componentActive } = useMeetingComponents<
    NoSettingsComponent<'active_users'>
  >(meetingId, 'active_users')

  function checkActive(user: number) {
    return !!meetingActiveUsers.get(meetingId.value)?.includes(user)
  }

  const isActive = computed({
    get() {
      if (!user.value) return false
      return checkActive(user.value.pk)
    },
    set(value) {
      setActive(value)
    }
  })

  async function setActive(active: boolean) {
    if (!user.value)
      throw new Error('Must have authenticated user to set active')
    await activeUserType.methodCall('set', {
      active,
      meeting: meetingId.value,
      user: user.value.pk
    })
  }

  return {
    activeUserIds: computed(
      () => meetingActiveUsers.get(meetingId.value) || []
    ),
    componentActive,
    isActive,
    checkActive,
    setActive
  }
}
