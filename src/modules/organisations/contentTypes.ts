import ContentType from '@/contentTypes/ContentType'
import {
  IOrganisation,
  OrganisationRole,
  IOrganisationUser,
  IUser
} from './types'

export const organisationType = new ContentType<
  IOrganisation,
  string,
  OrganisationRole
>({
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

export const userType = new ContentType<IOrganisationUser>({
  name: 'user',
  restEndpoint: 'users/'
})

export const profileType = new ContentType<IUser>({
  name: 'user',
  restEndpoint: 'user/',
  restConfig: { alertOnError: false }
})
