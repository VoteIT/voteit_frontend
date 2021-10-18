import ContentType from '@/contentTypes/ContentType'
import { Organisation, User } from './types'

export const organisationType = new ContentType<Organisation>({
  channelName: 'organisation', // Required for roles
  restEndpoint: 'organisations/',
  hasRoles: true
})

export const userType = new ContentType<User>({
  restEndpoint: 'users/'
})
