import useChannels from '@/composables/useChannels.js'

export default {
  naturalKey: 'presence.presencecheck',
  useChannels: config => useChannels('presence_system', config)
}
