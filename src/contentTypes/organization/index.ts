import ContentType from '../ContentType'
import { Organization } from '../types'
import rules from './rules'

export default new ContentType<Organization>({
  channelName: 'organisation', // Required for roles
  restEndpoint: 'organisations/',
  rules,
  hasRoles: true
})
