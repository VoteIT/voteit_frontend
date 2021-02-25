import { MeetingRoles, RestApiConfig } from '@/composables/types'
import ContentAPI from '../ContentAPI'

export default {
  naturalKey: 'auth.user',
  useContentApi: (config?: RestApiConfig) => new ContentAPI<MeetingRoles>('meeting-roles/', undefined, config)
}
