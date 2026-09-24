import { MeetingRole } from '@/modules/meetings/types'
import {
  OrganisationRole,
  IUser,
  IOrganisationUser
} from '@/modules/organisations/types'
import { ThemeColor } from '@/utils/types'
import { Component, ComponentInstance, MaybeRefOrGetter } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

interface BaseModal {
  dismissible?: boolean
  onClose?: () => void
  title?: MaybeRefOrGetter<string | undefined>
}

/**
 * Props (including listeners, e.g. onCancel) are checked against the component's own,
 * when opened through openModal (@/utils/modal).
 */
export interface ComponentModal<
  C extends Component = Component
> extends BaseModal {
  component: C
  props?: ComponentInstance<C>['$props']
}

export interface HTMLModal extends BaseModal {
  html: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Modal = ComponentModal<any> | HTMLModal

export function isComponentModal(modal: Modal): modal is ComponentModal {
  return 'component' in modal
}
export function isHTMLModal(modal: Modal): modal is HTMLModal {
  return 'html' in modal
}

export enum AlertLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export interface Alert {
  level: AlertLevel
  title: string
  text: string
  sticky?: boolean
  active?: boolean
}

export interface Dialog {
  title: string
  resolve: (value: boolean) => void
  dismissible?: boolean
  yes?: string | false
  no?: string | false
  theme?: ThemeColor
}

export interface OrganisationRoles {
  pk: number
  user: IOrganisationUser
  assigned: OrganisationRole[]
}

export interface MeetingRoles {
  pk: number
  user: IUser
  meeting: number
  assigned: MeetingRole[]
}

export interface UserContextRoles<T = string> {
  user: number
  assigned: Set<T>
}

// Internal representation. Maybe change this
// FIXME
export interface ContextRoles {
  model: string
  pk: number
  roles: string[]
  user_pk: number
}

export interface ContextRole<Role extends string = string> {
  description: string
  model_natural_key: string
  name: Role
  predicate_info?: any
  require_names?: string[]
  title: string
}

export interface ContextRoleDefinition {
  translateHelp(t: ComposerTranslation): string
  translateName(t: ComposerTranslation): string
}

export enum InitState {
  Loading = 1,
  Done = 2,
  Failed = 3
}
