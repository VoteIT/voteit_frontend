import { onBeforeMount, computed, ref, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import { ErrorStatus } from '@/socket/defineChannel'
import useChannel from '@/socket/useChannel'
import { openDialogEvent } from '@/utils/events'
import { type Progress, ThemeColor } from '@/utils/types'

import { moderatorChannel, participantChannel } from './contentTypes'
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

  const channel = useChannel(roleChannel, conditionalMeetingId)

  const loader = useLoader('useMeetingChannel', channel.promise)

  // How far the channel's delivery has got, for the progress bar. Reports
  // replace the ref's value rather than being merged into it, which is what a
  // shallow container needs to notice them.
  const progress = shallowRef<Progress>({ curr: 0, total: 1 })
  channel.promise.onProgress((p) => (progress.value = p))

  // The meeting can't be shown without this channel. A missing channel means
  // the meeting isn't there (or isn't ours), so there's nothing to wait for -
  // unlike a timeout, which the channel retries on reconnect.
  let dialogOpened = false
  watchEffect(() => {
    if (channel.subscribeError.value?.status !== ErrorStatus.NotFound) return
    if (dialogOpened) return
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

  const isLoaded = computed(() => !!meeting.value && channel.subscribed.value)

  return {
    isLoaded,
    fetchFailed,
    progress
  }
}
