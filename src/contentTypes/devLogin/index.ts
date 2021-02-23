import { RestApiConfig } from '@/composables/types'

import useContentApi from '../useContentApi'

export default {
  useContentApi: (config: RestApiConfig) => useContentApi('dev-login/', undefined, config)
}
