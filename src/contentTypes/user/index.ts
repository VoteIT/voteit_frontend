import { RestApiConfig } from '@/composables/types'
import { User } from '@/utils/types'
import ContentAPI from '../ContentAPI'

export default {
  naturalKey: 'auth.user',
  useContentApi: (config?: RestApiConfig) => new ContentAPI<User>('users/', undefined, config)
}
