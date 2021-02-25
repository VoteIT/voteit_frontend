import { RestApiConfig } from '@/composables/types'
import ContentAPI from '../ContentAPI'
import { MeetingAccessPolicy } from '../types'

export default {
  naturalKey: 'access_policy.accesspolicy',
  useContentApi: (config?: RestApiConfig) => new ContentAPI<MeetingAccessPolicy>('access-policies/', undefined, config)
}
