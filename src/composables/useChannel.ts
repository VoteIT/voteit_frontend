import { computed, onUnmounted, Ref, watch } from 'vue'

import Channel from '@/contentTypes/Channel'
import { ChannelConfig } from '@/contentTypes/types'
import { channelSubscribedEvent } from './events'

export default function useChannel (name: string | Ref<string | undefined>, pk: Ref<number | undefined>, config?: ChannelConfig) {
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
      await channel.subscribe(to)
      channelSubscribedEvent.emit(to)
    }
  }, { immediate: true })

  if (config?.leaveOnUnmount) {
    onUnmounted(() => {
      if (channelUri.value) channel.leave(channelUri.value)
    })
  }
}
