import { RestApiConfig } from '@/composables/types'

import ContentAPI from '../ContentAPI'
import { ElectoralRegister } from '../types'

export default {
  naturalKey: 'poll.electoralregister',
  useContentApi: (config?: RestApiConfig) => new ContentAPI<ElectoralRegister>('electoral-registers/', undefined, config)
}
