import { ContextRole, RestApiConfig } from '@/composables/types'
import useContextRoles from '@/composables/useContextRoles'
import { socket } from '@/utils/Socket'
import { ChannelsMessage } from '@/utils/types'
import Channel from './Channel'
import ContentAPI from './ContentAPI'
import { AvailableRolesPayload, ContextRolesPayload, RoleChangeMessage, RolesGetMessage } from './messages'
import { ChannelConfig, WorkflowState } from './types'
import useWorkflows from './useWorkflows'

type MethodHandler<T> = (item: T) => void

interface CType<S> {
  states?: WorkflowState<S>[]
  name: string // Content type name in channels
  restEndpoint?: string
  restConfig?: RestApiConfig
  channels?: string[]
  hasRoles?: boolean
  dateFields?: string[]
  useSocketApi?: boolean
}

export default class ContentType<T extends Record<string, any> = object, R extends string=string, K extends string | number=number> {
  contentType: CType<T['state']>
  methodHandlers: Map<string, MethodHandler<any>>
  rolesAvailable?: ContextRole[]
  private _api?: ContentAPI<T, K>
  private _channel?: Channel

  constructor (contentType: CType<T['state']>) {
    this.contentType = contentType
    this.methodHandlers = new Map()
    socket.registerTypeListener(this.name, this.handleMessage.bind(this))
  }

  private handleMessage (msg: ChannelsMessage) {
    const [name, method] = msg.t.split('.')
    const handler = this.methodHandlers.get(method)
    if (handler) handler(msg.p)
  }

  private dateify (obj: Record<string, unknown>): T {
    if (!this.contentType.dateFields) return obj as T
    for (const field of this.contentType.dateFields) {
      const value = obj[field]
      if (typeof value === 'string') obj[field] = new Date(value)
    }
    return obj as T
  }

  public updateMap (map: Map<number, T>, cb?: (obj: T, old?: T) => void) {
    return this
      .onChanged(item => {
        const old = map.get(item.pk)
        item = this.dateify(item)
        map.set(item.pk, item)
        cb?.(item, old)
      })
      .onDeleted(item => map.delete(item.pk))
  }

  public get name () {
    return this.contentType.name
  }

  public get workflowStates () {
    return this.contentType.states
  }

  public get api () {
    // Cache an api instance with default settings
    if (!this._api) this._api = this.getContentApi(this.contentType.restConfig)
    return this._api
  }

  public get channel () {
    // Cache default channel instance with default settings
    if (!this._channel) this._channel = this.getChannel(this.name)
    return this._channel
  }

  public methodCall<RT=T> (method: string, data?: object, config?: ChannelConfig) {
    return socket.call<RT>(`${this.name}.${method}`, data, config)
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

  public getChannel (name?: string, config?: ChannelConfig): Channel {
    name = name ?? this.name
    if (!this.contentType.channels?.includes(name)) throw new Error(`Content Type "${this.name}" has no channel "${name}"`)
    return new Channel(name, config)
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
    this.assertHasRoles()
    return useContextRoles<R>(this.contentType.name)
  }

  // Moved from Channel

  private assertHasRoles (): void {
    if (!this.contentType.hasRoles) throw new Error(`Content Type ${this.name} is not configured to have context roles.`)
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
