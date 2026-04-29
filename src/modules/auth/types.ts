import { OrganisationRole } from '../organisations/types'

export interface IDjangoMessage {
  level: number
  level_tag: 'debug' | 'info' | 'success' | 'warning' | 'error'
  message: string
  tags: string
}
