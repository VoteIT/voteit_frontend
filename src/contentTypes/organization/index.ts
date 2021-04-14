import ContentType from '../ContentType'
import { Organization } from '../types'

export default new ContentType<Organization>({
  restEndpoint: 'organisations/'
})
