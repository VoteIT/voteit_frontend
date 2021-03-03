import { RestApiConfig } from '@/composables/types'
import { DevUser } from '@/utils/types'
import ContentAPI from '../ContentAPI'
import ContentType from '../ContentType'

export default new ContentType<DevUser, string>({
  restEndpoint: 'dev-login/'
})
