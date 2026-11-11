import { ComposerTranslation } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'
import { MeetingRole } from '@/modules/meetings/types'

export interface IStateMeta {
  color?: ThemeColor
  icon: string
  translate(t: ComposerTranslation, count?: number): string
  priority?: number
}

export type ConditionalWorkflowStates<T extends { state?: string }> =
  T['state'] extends string
    ? {
        name: string
        meta: Record<T['state'], IStateMeta>
      }
    : never

export interface BaseContent {
  readonly pk: number
  title: string
}

export interface StateContent extends BaseContent {
  state: string
}

export interface Vote {
  pk: number
  abstain: boolean
  /** Null when abstaining, or - with abstain false - when cleared after the meeting */
  vote: object | null
  poll: number
}

export enum AccessPolicyType {
  Automatic = 'automatic',
  ModeratorApproved = 'moderator_approved'
}

export interface AccessPolicy {
  pk: number
  meeting: number
  active: boolean
  name: AccessPolicyType
  roles_given: MeetingRole[]
}

export interface MeetingAccessPolicy {
  pk: number // Meeting id
  policies: AccessPolicy[]
}
