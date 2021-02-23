import { RestApiConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  useContentApi: (config: RestApiConfig) => useContentApi('access-policies/', undefined, config)
}
