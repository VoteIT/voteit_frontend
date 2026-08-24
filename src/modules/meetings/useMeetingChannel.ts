import { sum } from 'itertools'
import { onBeforeMount, computed, ref, shallowReactive, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import { ErrorStatus } from '@/socket/defineChannel'
import useChannel from '@/socket/useChannel'
import { openDialogEvent } from '@/utils/events'
import { type Progress, ThemeColor } from '@/utils/types'

import {
  meetingChannel,
  moderatorChannel,
  participantChannel
} from './contentTypes'
import useMeeting from './useMeeting'
import useMeetingStore from './useMeetingStore'

export default function useMeetingChannel() {
  const { isModerator, meetingId, meeting, userRoles } = useMeeting()
  const { fetchMeeting } = useMeetingStore()
  const router = useRouter()
  const { t } = useI18n()

  const fetchFailed = ref(false)

  /** Ensure we have valid user roles before attempting to subscribe */
  const conditionalMeetingId = computed(() =>
    userRoles.value?.size ? meetingId.value : undefined
  )

  const roleChannel = computed(() =>
    isModerator.value ? moderatorChannel : participantChannel
  )

  const channels = [
    useChannel(meetingChannel, conditionalMeetingId),
    useChannel(roleChannel, conditionalMeetingId)
  ]

  const loader = useLoader(
    'useMeetingChannel',
    ...channels.map((ch) => ch.promise)
  )

  // Where each channel's delivery has got to. Reports replace their slot
  // rather than being merged into it, which is what a shallow container needs
  // to notice them.
  const channelProgress = shallowReactive<Progress[]>(
    channels.map(() => ({ curr: 0, total: 1 }))
  )
  for (const [i, channel] of channels.entries())
    channel.promise.onProgress((p) => (channelProgress[i] = p))

  // Added up, so a single bar can show how far the whole meeting subscription
  // has got: each channel reports its own collectors, and nobody cares which
  // of them a completed one belonged to.
  const progress = computed<Progress>(() => ({
    curr: sum(channelProgress.map(({ curr }) => curr)),
    total: sum(channelProgress.map(({ total }) => total))
  }))

  // The meeting can't be shown without these channels. A missing channel means
  // the meeting isn't there (or isn't ours), so there's nothing to wait for -
  // unlike a timeout, which the channel retries on reconnect.
  let dialogOpened = false
  watchEffect(() => {
    const missing = channels.some(
      (ch) => ch.subscribeError.value?.status === ErrorStatus.NotFound
    )
    if (!missing || dialogOpened) return
    dialogOpened = true
    openDialogEvent.emit({
      dismissible: false,
      title: t('meeting.subscriptionFailedMessage'),
      theme: ThemeColor.Error,
      no: false,
      yes: t('meeting.subscriptionFailedButton'),
      resolve() {
        router.push({ name: 'home' })
      }
    })
  })

  onBeforeMount(() => {
    loader.call(async () => {
      try {
        if (!(await fetchMeeting(meetingId.value)))
          await router.push({ name: 'meeting:join' }) // Fetch was OK, but user has no meeting role
      } catch {
        fetchFailed.value = true
      }
    })
  })

  const isLoaded = computed(
    () => !!meeting.value && channels.every((ch) => ch.subscribed.value)
  )

  return {
    isLoaded,
    fetchFailed,
    progress
  }
}
