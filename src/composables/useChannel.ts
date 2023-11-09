import { computed, onUnmounted, reactive, Ref, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ChannelConfig } from '@/contentTypes/types'
import { openDialogEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import { useRouter } from 'vue-router'
import { socket } from '@/utils/Socket'

import { channelLeftEvent, channelSubscribedEvent } from './events'

type SubscriptionObj = ReturnType<(typeof socket)['channels']['subscribe']>

const subscribedChannels = reactive(new Set<string>())
channelSubscribedEvent.on((channel) => subscribedChannels.add(channel.path))
channelLeftEvent.on((channel) => subscribedChannels.delete(channel.path))

export default function useChannel(
  name: string | Ref<string | undefined>,
  pk: Ref<number | undefined>,
  config?: ChannelConfig & { critical?: boolean }
) {
  const { t } = useI18n()
  const router = useRouter()

  let subscription: SubscriptionObj | undefined

  // Critical subscription errors handled here
  if (config?.critical) config.alertOnError = false

  /**
   * Use to know if channel is complete and watch for changes
   */
  const channelPath = computed(() => {
    const channelType = unref(name)
    if (!channelType || !pk.value) return
    return `${channelType}/${pk.value}`
  })
  const isSubscribed = computed(
    () => channelPath.value && subscribedChannels.has(channelPath.value)
  )

  async function subscribe() {
    // Must only be called if name and pk is set
    const channelType = unref(name)!
    subscription = socket.channels.subscribe(channelType, pk.value!)
    try {
      await subscription.promise
    } catch (e) {
      if (config?.critical) {
        openDialogEvent.emit({
          dismissible: false,
          title: t('meeting.subscriptionFailedMessage'),
          theme: ThemeColor.Error,
          no: false,
          yes: t('meeting.subscriptionFailedButton'),
          resolve: async () => {
            router.push('/')
          }
        })
      }
    }
  }

  watch(channelPath, (to) => {
    subscription?.leave(config?.leaveDelay)
    if (to) subscribe()
  })

  onUnmounted(() => {
    subscription?.leave(config?.leaveDelay)
  })

  return {
    isSubscribed,
    promise: channelPath.value ? subscribe() : Promise.resolve()
  }
}
