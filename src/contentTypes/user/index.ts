import { RestApiConfig } from '@/composables/types'
import useContentApi from '../useContentApi'

export default {
  naturalKey: 'auth.user',
  useContentApi: (config?: RestApiConfig) => useContentApi('users/', undefined, config)
}
