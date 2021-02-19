import useChannels from '@/composables/useChannels.js'

export default {
  naturalKey: 'presence.presence',
  useChannels: config => useChannels('presence', config)
}
