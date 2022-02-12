import Channel from '@/contentTypes/Channel'
import { ChannelConfig } from '@/contentTypes/types'
import { computed, Ref, watch } from 'vue'

export default function useChannel (name: string | Ref<string | undefined>, pk: Ref<number | undefined>, config?: ChannelConfig) {
  const channel = new Channel('', config) // Empty channel, so that we can dynamically switch channel names

  const channelUri = computed(() => {
    const channel = typeof name === 'string'
      ? name
      : name.value
    if (!channel || !pk.value) return
    return `${channel}/${pk.value}`
  })
  watch(channelUri, (to, from) => {
    if (from) channel.leave(from)
    if (to) channel.subscribe(to)
  }, { immediate: true })
}
