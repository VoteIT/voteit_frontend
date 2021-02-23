import { ChannelConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  naturalKey: 'poll.electoralregister',
  useContentApi: (config?: ChannelConfig) => useContentApi('electoral-registers/', undefined, config)
}
