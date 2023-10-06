import ContentType from '@/contentTypes/ContentType'
import { Organisation, OrganisationRole, User } from './types'

export const organisationType = new ContentType<Organisation, OrganisationRole>({
  name: 'organisation', // Required for roles
  channels: ['organisation'],
  restEndpoint: 'organisations/',
  roles: {
    meeting_creator: {
      translateHelp: (t) => t('role.help.meeting_creator'),
      translateName: (t) => t('role.meeting_creator')
    },
    org_manager: {
      translateHelp: (t) => t('role.help.org_manager'),
      translateName: (t) => t('role.org_manager')
    }
  }
})

export const userType = new ContentType<User>({
  name: 'user',
  restEndpoint: 'users/'
})

export const profileType = new ContentType<User>({
  name: 'user',
  restEndpoint: 'user/',
  restConfig: { alertOnError: false }
})
