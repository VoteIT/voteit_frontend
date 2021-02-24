/* eslint-disable camelcase */

import { PollMethodName } from '@/components/pollmethods/types'
import { Payload } from '@/utils/types'

export interface WorkflowState {
  state: string
  icon: string
  transition?: string
  name?: string
  requiresRole?: string
  isFinal?: boolean
}

export interface BaseContent extends Payload {
  [ index: string ]: any
  pk: number
  created: string | Date
  title: string
  author: number
}

export interface StateContent extends BaseContent {
  state: string
}

export interface SpeakerList extends StateContent {
}

export interface Meeting extends StateContent {
  body: string
}

export interface AgendaItem extends StateContent {
  body: string
}

export interface Proposal extends StateContent {
  body: string
  agenda_item: number
  polls: number[]
  prop_id: string
}

export interface Poll extends StateContent {
  agenda_item: number
  meeting: number
  method_name: PollMethodName
}

export interface DiscussionPost extends BaseContent {
  body: string
}

export interface SpeakerSystem {
  pk: number
  meeting: number
  active: boolean
  active_list: number | null
}

export interface PresenceCheck extends StateContent {
  // Probably not Statecontent
}

export interface Presence {
  pk: number
  user: number
  presence_check: number
}

export interface ElectoralRegister {
  pk: number
  voters: number[]
}

export interface Vote {
  abstain: boolean
  vote: Object
}

export interface AccessPolicy {
  pk: number
  meeting: number
  active: boolean
  name: string
  roles_given: string[]
}

export interface MeetingAccessPolicy {
  pk: number // Meeting id
  policies: AccessPolicy[]
}
