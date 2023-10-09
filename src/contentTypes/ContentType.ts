import { socket } from '@/utils/Socket'
import { ChannelsMessage } from '@/utils/types'
import { ContextRole, ContextRoleDefinition, RestApiConfig } from '@/composables/types'
import useContextRoles from '@/composables/useContextRoles'

import Channel from './Channel'
import ContentAPI from './ContentAPI'
import { AvailableRolesPayload, ContextRolesPayload, RoleChangeMessage, RolesGetMessage } from './messages'
import { ChannelConfig, WorkflowState } from './types'
import useWorkflows from './useWorkflows'
import contentCleanup, { ChannelMap } from './contentCleanup'

type MethodHandler<T> = (item: T) => void
type PKStateContent = { pk: number, state?: string }

interface CType<T extends Partial<PKStateContent>> {
  states?: WorkflowState<T['state']>[]
  name: string // Content type name in channels
  restEndpoint?: string
  restConfig?: RestApiConfig
  channels?: string[]
  useSocketApi?: boolean
}

/**
 * Basic content type, providing a unified access to rest and socket api.
 * Used for content that has no pk or state.
 */
export class BaseContentType<T extends {}, K extends string | number = number> {
  protected readonly contentType: CType<T>
  protected methodHandlers: Map<string, MethodHandler<any>>
  private _api?: ContentAPI<T, K>

  constructor (contentType: CType<T>) {
    this.contentType = contentType
    this.methodHandlers = new Map()
    socket.addTypeHandler(this.name, this.handleMessage.bind(this))
  }

  public get name () {
    return this.contentType.name
  }

  private handleMessage (msg: ChannelsMessage) {
    const method = msg.t.split('.')[1]
    const handler = this.methodHandlers.get(method)
    if (handler) handler(msg.p)
  }

  public methodCall<RT=T> (method: string, data?: object, config?: ChannelConfig) {
    return socket.call<RT>(`${this.name}.${method}`, data, config)
  }

  public on<LT=T> (method: string, fn: MethodHandler<LT>, override = true) {
    if (override || !this.methodHandlers.has(method)) this.methodHandlers.set(method, fn)
    return this
  }

  public onChanged (fn: MethodHandler<T>) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    return this.on('added', fn, false)
      .on('changed', fn)
  }

  public onDeleted (fn: MethodHandler<T>) {
    return this.on('deleted', fn)
  }

  public getContentApi (config?: RestApiConfig) {
    if (!this.contentType.restEndpoint) throw new Error(`Content Api not configured for Content Type ${this.name}`)
    return new ContentAPI<T, K>(this.contentType.restEndpoint, this.contentType.states, config)
  }

  public get api () {
    // Cache an api instance with default settings
    if (!this._api) this._api = this.getContentApi(this.contentType.restConfig)
    return this._api
  }
}

/**
 * Default content type, providing a unified access to rest and socket api, workflow states and possibly roles.
 * Used for content that has pk and possibly state.
 */
export default class ContentType<T extends PKStateContent = { pk: number }, R extends string = string, K extends string | number = number> extends BaseContentType<T, K> {
  private roles?: Record<R, ContextRoleDefinition>
  private rolesAvailable?: ContextRole[]
  private _channel?: Channel

  constructor (contentType: CType<T> & { roles?: Record<R, ContextRoleDefinition> }) {
    const { roles, ...ct } = contentType
    super(ct)
    this.roles = roles
  }

  public getRole (role: R): ContextRoleDefinition {
    if (!this.roles) throw new Error('No role definitions available')
    return this.roles[role]
  }

  public updateMap (map: Map<number, T>, channelMap?: ChannelMap<T>) {
    if (channelMap) {
      contentCleanup.register(map, channelMap)
    }
    return this
      .onChanged(item => map.set(item.pk, item))
      .onDeleted(item => map.delete(item.pk))
  }

  public get workflowStates () {
    return this.contentType.states
  }

  private getChannel (name?: string, config?: ChannelConfig): Channel {
    name = name ?? this.name
    if (!this.contentType.channels?.includes(name)) throw new Error(`Content Type "${this.name}" has no channel "${name}"`)
    return new Channel(name, config)
  }

  public get channel () {
    // Cache default channel instance with default settings
    if (!this._channel) this._channel = this.getChannel(this.name)
    return this._channel
  }

  public add (data: Partial<T>, config?: ChannelConfig) {
    if (this.contentType.useSocketApi) return this.methodCall('add', data, config)
    return this.api.add(data)
  }

  public update (pk: K, data: Partial<T>, config?: ChannelConfig) {
    if (this.contentType.useSocketApi) return this.methodCall('change', { pk, kwargs: data }, config)
    return this.api.patch(pk, data)
  }

  public delete (pk: K, config?: ChannelConfig) {
    if (this.contentType.useSocketApi) return this.methodCall('delete', { pk }, config)
    return this.api.delete(pk)
  }

  public useWorkflows () {
    if (!this.contentType.states) throw new Error(`Workflow States not configured for Content Type ${this.name}`)
    return useWorkflows<T['state']>(this.contentType.states)
  }

  public useContextRoles () {
    this.assertHasRoles()
    return useContextRoles<R>(this.contentType.name)
  }

  // Moved from Channel

  private assertHasRoles (): void {
    if (!this.roles) throw new Error(`Content Type ${this.name} is not configured to have context roles.`)
  }

  public async getAvailableRoles (): Promise<ContextRole[]> {
    this.assertHasRoles()
    if (this.rolesAvailable) return this.rolesAvailable
    const response = await socket.call<AvailableRolesPayload>('roles.available', { model: this.name })
    const { roles } = response.p
    this.rolesAvailable = roles
    return roles
  }

  public async fetchRoles (pk: number, users?: number[]) {
    const { set } = this.useContextRoles()
    const message: RolesGetMessage = {
      model: this.name,
      pk,
      filter_users: users
    }
    const { p } = await socket.call<ContextRolesPayload<R>>('roles.get', message)
    for (const [user, roles] of p.items) {
      set(pk, user, roles)
    }
  }

  private changeRoles (method: string, pk: number, user: number, roles: string[]) {
    this.assertHasRoles()
    const message: RoleChangeMessage = {
      model: this.name,
      pk,
      users: [user],
      roles
    }
    return socket.call(`roles.${method}`, message)
  }

  public addRoles (pk: number, user: number, ...roles: string[]) {
    return this.changeRoles('add', pk, user, roles)
  }

  public removeRoles (pk: number, user: number, ...roles: string[]) {
    return this.changeRoles('remove', pk, user, roles)
  }
}
