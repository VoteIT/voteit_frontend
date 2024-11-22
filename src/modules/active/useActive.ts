import { computed, reactive, ref, Ref, watch } from 'vue'

import { user } from '@/composables/useAuthentication'

import { meetingType } from '../meetings/contentTypes'
import { NoSettingsComponent } from '../meetings/types'
import useMeetingComponents from '../meetings/useMeetingComponent'

import { activeUserType } from './contentTypes'
import { sleep } from '@/utils'

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

const dismissedMeetings = reactive(new Set<number>())

export default function useActive(meetingId: Ref<number>) {
  const { componentActive } = useMeetingComponents<
    NoSettingsComponent<'active_users'>
  >(meetingId, 'active_users')

  // If Active component if switched on/off, clear dismissed status.
  watch(componentActive, () => dismissedMeetings.delete(meetingId.value))

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

  const isDismissed = computed(() => dismissedMeetings.has(meetingId.value))
  const isBusy = ref(false)

  async function setActive(active: boolean) {
    if (!user.value)
      throw new Error('Must have authenticated user to set active')
    isBusy.value = true
    await activeUserType.methodCall('set', {
      active,
      meeting: meetingId.value,
      user: user.value.pk
    })
    await sleep(2_000)
    isBusy.value = false
  }

  function dismiss() {
    dismissedMeetings.add(meetingId.value)
  }

  return {
    activeUserIds: computed(
      () => meetingActiveUsers.get(meetingId.value) || []
    ),
    componentActive,
    isActive,
    isBusy,
    isDismissed,
    dismiss,
    checkActive,
    setActive
  }
}
