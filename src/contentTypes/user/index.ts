import ContentType from '../ContentType'
import { User } from '../types'

export default new ContentType<User>({
  restEndpoint: 'users/'
})
