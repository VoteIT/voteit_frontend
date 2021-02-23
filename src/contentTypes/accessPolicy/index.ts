import { RestApiConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  naturalKey: 'access_policy.accesspolicy',
  useContentApi: (config?: RestApiConfig) => useContentApi('access-policies/', undefined, config)
}
