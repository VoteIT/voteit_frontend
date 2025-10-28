import { computed, reactive, ref, Ref, watch } from 'vue'

import { meetingType } from '../meetings/contentTypes'
import useMeetingComponent from '../meetings/useMeetingComponent'

import { activeUserType } from './contentTypes'
import { sleep } from '@/utils'
import { storeToRefs } from 'pinia'
import useAuthStore from '../auth/useAuthStore'

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
  const authStore = useAuthStore()
  const { componentActive } = useMeetingComponent(meetingId, 'active_users')

  // If Active component if switched on/off, clear dismissed status.
  watch(componentActive, () => dismissedMeetings.delete(meetingId.value))

  function checkActive(user: number) {
    return !!meetingActiveUsers.get(meetingId.value)?.includes(user)
  }

  const isActive = computed({
    get() {
      if (!authStore.user) return false
      return checkActive(authStore.user.pk)
    },
    set(value) {
      setActive(value)
    }
  })

  const isDismissed = computed(() => dismissedMeetings.has(meetingId.value))
  const isBusy = ref(false)

  async function setActive(active: boolean) {
    if (!authStore.user)
      throw new Error('Must have authenticated user to set active')
    isBusy.value = true
    await activeUserType.methodCall('set', {
      active,
      meeting: meetingId.value,
      user: authStore.user.pk
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
