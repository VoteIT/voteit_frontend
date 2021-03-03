import ContentType from '../ContentType'
import { MeetingAccessPolicy } from '../types'

export default new ContentType<MeetingAccessPolicy>({
  restEndpoint: 'access-policies/'
})
