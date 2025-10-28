import { OrganisationRole } from '../organisations/types'

export interface IUser {
  pk: number
  first_name: string
  img_url: string | null
  last_name: string
  organisation: number // Only for authenticated user
  organisation_roles: OrganisationRole[] // Only when loading authenticated user from /api/user
  userid: string | null
  email: string
}
