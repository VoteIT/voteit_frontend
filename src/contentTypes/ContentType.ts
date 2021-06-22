import { RestApiConfig } from '@/composables/types'
import useContextRoles from '@/composables/useContextRoles'
import Channel from './Channel'
import ContentAPI from './ContentAPI'
import { ChannelConfig, Predicate, WorkflowState } from './types'
import useWorkflows from './useWorkflows'

interface CType {
  states?: WorkflowState[]
  rules?: Record<string, Predicate>
  channelName?: string
  restEndpoint?: string
  hasRoles?: boolean
}

export default class ContentType<T, K=number> {
  contentType: CType

  constructor (contentType: CType) {
    this.contentType = contentType
  }

  public get name () {
    return this.contentType.channelName || this.contentType.restEndpoint
  }

  public get workflowStates () {
    return this.contentType.states
  }

  public get rules () {
    return this.contentType.rules || {}
  }

  getChannel (config?: ChannelConfig): Channel<T> {
    if (this.contentType.channelName) {
      return new Channel<T>(this.contentType.channelName, config, this.contentType.hasRoles)
    }
    throw new Error(`Channel not configured for Content Type ${this.name}`)
  }

  getContentApi (config?: RestApiConfig): ContentAPI<T, K> {
    if (this.contentType.restEndpoint) {
      return new ContentAPI<T, K>(this.contentType.restEndpoint, this.contentType.states, config)
    }
    throw new Error(`Content Api not configured for Content Type ${this.name}`)
  }

  useWorkflows () {
    if (this.contentType.states) {
      return useWorkflows(this.contentType.states)
    }
    throw new Error(`Workflow States not configured for Content Type ${this.name}`)
  }

  useContextRoles () {
    if (this.contentType.hasRoles && this.contentType.channelName) {
      return useContextRoles(this.contentType.channelName)
    }
    throw new Error(`Context Roles not configured for Content Type ${this.name}`)
  }
}
