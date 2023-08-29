import { computed, onUnmounted, ref, Ref, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ChannelConfig } from '@/contentTypes/types'
import { openDialogEvent } from '@/utils/events'
import { channelSubscribedEvent } from './events'
import { ThemeColor } from '@/utils/types'
import { useRouter } from 'vue-router'
import { socket } from '@/utils/Socket'

type SubscriptionObj = ReturnType<typeof socket['channels']['subscribe']>

export default function useChannel (name: string | Ref<string | undefined>, pk: Ref<number | undefined>, config?: ChannelConfig & { critical?: boolean }) {
  const { t } = useI18n()
  const router = useRouter()

  const isSubscribed = ref(false)
  let subscription: SubscriptionObj | undefined

  // Critical subscription errors handled here
  if (config?.critical) config.alertOnError = false

  /**
   * Use to know if channel is complete and watch for changes
   */
  const channelPath = computed(() => {
    const channel = unref(name)
    if (!channel || !pk.value) return
    return `${channel}/${pk.value}`
  })

  async function subscribe () {
    // Must only be called if name and pk is set
    const channelType = unref(name)!
    subscription = socket.channels.subscribe(channelType, pk.value!)
    try {
      await subscription.promise
      channelSubscribedEvent.emit({
        // eslint-disable-next-line camelcase
        channel_type: channelType,
        pk: pk.value!
      })
      isSubscribed.value = true
    } catch (e) {
      console.error('failed for', channelType, e)
      if (config?.critical) {
        openDialogEvent.emit({
          dismissible: false,
          title: t('meeting.subscriptionFailedMessage'),
          theme: ThemeColor.Error,
          no: false,
          yes: t('meeting.subscriptionFailedButton'),
          resolve: async () => { router.push('/') }
        })
      }
    }
  }

  watch(channelPath, (to, from) => {
    isSubscribed.value = false
    if (from) subscription?.leave()
    if (to) subscribe()
  })

  if (config?.leaveOnUnmount) {
    onUnmounted(() => {
      if (channelPath.value) subscription?.leave()
    })
  }

  return {
    isSubscribed,
    promise: channelPath.value
      ? subscribe()
      : Promise.resolve()
  }
}
