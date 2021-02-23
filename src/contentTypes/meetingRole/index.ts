import { ChannelConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  naturalKey: 'auth.user',
  useContentApi: (config?: ChannelConfig) => useContentApi('meeting-roles/', undefined, config)
}
