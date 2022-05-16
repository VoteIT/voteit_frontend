import ContentType from '@/contentTypes/ContentType'
import { AccessPolicy } from '@/contentTypes/types'

export const automaticAccessType = new ContentType<AccessPolicy>({
  name: 'automatic_access',
  restEndpoint: 'access-policy-automatic/'
})
