import { MeetingRoles } from '@/composables/types'
import ContentType from '../ContentType'

export default new ContentType<MeetingRoles>({
  restEndpoint: 'meeting-roles/'
})
