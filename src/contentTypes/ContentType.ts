import { RestApiConfig } from '@/composables/types'
import useContextRoles from '@/composables/useContextRoles'
import Channel from './Channel'
import ContentAPI from './ContentAPI'
import { ChannelConfig, WorkflowState } from './types'
import useWorkflows from './useWorkflows'

interface CType<S> {
  states?: WorkflowState<S>[]
  // rules?: Record<string, Predicate>
  channelName?: string
  restEndpoint?: string
  hasRoles?: boolean
  dateFields?: string[]
}

export default class ContentType<T extends Record<string, any>, K extends string | number=number> {
  contentType: CType<T['state']>
  private _api?: ContentAPI<T, K>
  private _channel?: Channel<T>

  constructor (contentType: CType<T['state']>) {
    this.contentType = contentType
  }

  private dateify (obj: Record<string, any>): T {
    if (!this.contentType.dateFields) return obj as T
    for (const field of this.contentType.dateFields) {
      if (typeof obj[field] === 'string') obj[field] = new Date(obj[field])
    }
    return obj as T
  }

  public channelUpdateMap (map: Map<number, T>) {
    return this.channel.updateMap(map, this.dateify.bind(this))
  }

  public get name () {
    return this.contentType.channelName || this.contentType.restEndpoint
  }

  public get workflowStates () {
    return this.contentType.states
  }

  // public get rules () {
  //   return this.contentType.rules || {}
  // }

  public get api () {
    // Cache an api instance with default settings
    if (!this._api) this._api = this.getContentApi()
    return this._api
  }

  public get channel () {
    // Cache a channel instance with default settings
    if (!this._channel) this._channel = this.getChannel()
    return this._channel
  }

  public getChannel (config?: ChannelConfig): Channel<T> {
    if (!this.contentType.channelName) throw new Error(`Channel not configured for Content Type ${this.name}`)
    return new Channel<T>(this.contentType.channelName, config, this.contentType.hasRoles)
  }

  public getContentApi (config?: RestApiConfig): ContentAPI<T, K> {
    if (!this.contentType.restEndpoint) throw new Error(`Content Api not configured for Content Type ${this.name}`)
    return new ContentAPI<T, K>(this.contentType.restEndpoint, this.contentType.states, config)
  }

  public useWorkflows () {
    if (!this.contentType.states) throw new Error(`Workflow States not configured for Content Type ${this.name}`)
    return useWorkflows<T['state']>(this.contentType.states)
  }

  public useContextRoles () {
    if (!this.contentType.hasRoles || !this.contentType.channelName) throw new Error(`Context Roles not configured for Content Type ${this.name}`)
    return useContextRoles(this.contentType.channelName)
  }
}
