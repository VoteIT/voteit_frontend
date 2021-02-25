import { RestApiConfig } from '@/composables/types'
import { DevUser } from '@/utils/types'
import ContentAPI from '../ContentAPI'

export default {
  naturalKey: 'auth.user',
  useContentApi: (config?: RestApiConfig) => new ContentAPI<DevUser, string>('dev-login/', undefined, config)
}
