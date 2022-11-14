import { computed, onUnmounted, ref, Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Channel from '@/contentTypes/Channel'
import { ChannelConfig } from '@/contentTypes/types'
import { openDialogEvent } from '@/utils/events'
import { channelSubscribedEvent } from './events'
import { ThemeColor } from '@/utils/types'
import { useRouter } from 'vue-router'

export default async function useChannel (name: string | Ref<string | undefined>, pk: Ref<number | undefined>, config?: ChannelConfig & { critical?: boolean }) {
  const { t } = useI18n()
  const router = useRouter()

  // Critical subscription errors handled here
  if (config?.critical) config.alertOnError = false
  const channel = new Channel('', config) // Empty channel, so that we can dynamically switch channel names

  const channelUri = computed(() => {
    const channel = typeof name === 'string'
      ? name
      : name.value
    if (!channel || !pk.value) return
    return `${channel}/${pk.value}`
  })

  watch(channelUri, async (to, from) => {
    if (from) channel.leave(from)
    if (to) {
      try {
        await channel.subscribe(to)
        channelSubscribedEvent.emit(to)
      } catch {
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
  })//, { immediate: true })

  if (config?.leaveOnUnmount) {
    onUnmounted(() => {
      if (channelUri.value) channel.leave(channelUri.value)
    })
  }

  // Function is async (=returns promise). If channelUri can be established, resolve with response to subscription request. Errors should be propagated.
  if (channelUri.value) {
    const response = await channel.subscribe(channelUri.value)
    channelSubscribedEvent.emit(channelUri.value)
    return response
  }
}
