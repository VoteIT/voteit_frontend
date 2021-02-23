import { ChannelConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  useContentApi: (config: ChannelConfig) => useContentApi('meeting-roles/', undefined, config)
}
