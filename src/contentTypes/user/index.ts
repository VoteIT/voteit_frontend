import { RestApiConfig } from '@/composables/types'
import { User } from '@/utils/types'
import ContentType from '../ContentType'

export default new ContentType<User>({
  restEndpoint: 'users/'
})
