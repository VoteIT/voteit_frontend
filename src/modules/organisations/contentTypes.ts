import ContentType from '@/contentTypes/ContentType'
import { Organisation, User } from './types'

export const organisationType = new ContentType<Organisation>({
  name: 'organisation', // Required for roles
  restEndpoint: 'organisations/',
  hasRoles: true
})

export const userType = new ContentType<User>({
  name: 'user',
  restEndpoint: 'users/'
})

export const profileType = new ContentType<User>({
  name: 'user',
  restEndpoint: 'user/'
})
