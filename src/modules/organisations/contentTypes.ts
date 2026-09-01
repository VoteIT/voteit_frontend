import ContentType, { BaseContentType } from '@/contentTypes/ContentType'

import {
  IOrganisation,
  OrganisationRole,
  IOrganisationUser,
  IUser
} from './types'

export const organisationType = new ContentType<
  IOrganisation,
  OrganisationRole
>({
  name: 'organisation', // Required for roles
  restEndpoint: 'organisation/',
  roles: {
    definitions: {
      meeting_creator: {
        translateHelp: (t) => t('role.help.meeting_creator'),
        translateName: (t) => t('role.meeting_creator')
      },
      org_manager: {
        translateHelp: (t) => t('role.help.org_manager'),
        translateName: (t) => t('role.org_manager')
      }
    },
    endpoint: 'organisation-roles/'
  }
})

export const userType = new BaseContentType<IUser>({
  name: 'user',
  restEndpoint: 'users/'
})

export const profileType = new BaseContentType<IOrganisationUser>({
  name: 'user',
  restEndpoint: 'user/'
})
