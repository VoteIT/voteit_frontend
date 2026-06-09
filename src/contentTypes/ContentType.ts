import { socket } from '@/utils/Socket'
import { ChannelsMessage } from '@/utils/types'
import {
  ContextRole,
  ContextRoleDefinition,
  RestApiConfig
} from '@/composables/types'
import useContextRoles from '@/composables/useContextRoles'

import { IUser } from '@/modules/organisations/types'
import useUserDetails from '@/modules/organisations/useUserDetails'

import ContentAPI from './ContentAPI'
import { ChannelConfig, ConditionalWorkflowStates } from './types'
import contentCleanup, { ChannelMap } from './contentCleanup'
import useStateMachine from '@/composables/useStateMachine'

type MethodHandler<T> = (item: T) => void

interface IContentType<
  T extends { pk?: number; state?: string },
  Role extends string = never
> {
  name: string // Content type name in channels
  restConfig?: RestApiConfig
  restEndpoint?: string
  roles?: {
    definitions: Record<Role, ContextRoleDefinition>
    endpoint: string
  }
  states?: ConditionalWorkflowStates<T>
}

/**
 * Basic content type, providing a unified access to rest and socket api.
 * Used for content that has no state.
 */
export class BaseContentType<T extends {}, Role extends string = never> {
  protected readonly contentType: IContentType<T, Role>
  protected methodHandlers: Map<string, MethodHandler<any>>
  private _api?: ContentAPI<T>
  private messageQueue: Map<string, ChannelsMessage['p'][]> // Payloads

  constructor(contentType: IContentType<T, Role>) {
    this.contentType = contentType
    this.methodHandlers = new Map()
    this.messageQueue = new Map()
    socket.addTypeHandler(this.name, this.handleMessage.bind(this))
  }

  public get name() {
    return this.contentType.name
  }

  /**
   * If we get a message that has no handler yet, queue that message for when/if we get a handler.
   */
  private queueMessage(method: string, payload: ChannelsMessage['p']) {
    if (!this.messageQueue.has(method)) this.messageQueue.set(method, [])
    this.messageQueue.get(method)!.push(payload)
  }

  /**
   * Whenever a handler is registered, check for queued messages and send immediately.
   * Queue will then be cleared.
   */
  private sendQueuedMessages(method: string, handler: MethodHandler<any>) {
    const queuedMessages = this.messageQueue.get(method)
    if (!queuedMessages) return
    for (const payload of queuedMessages) handler(payload)
    // Clear queue
    this.messageQueue.delete(method)
  }

  private handleMessage({ p, t }: ChannelsMessage) {
    const method = t.split('.')[1]
    const handler = this.methodHandlers.get(method)
    if (handler) handler(p)
    else this.queueMessage(method, p)
  }

  public methodCall<RT = T>(
    method: string,
    data?: object,
    config?: ChannelConfig
  ) {
    return socket.call<RT>(`${this.name}.${method}`, data, config)
  }

  public on<LT = T>(method: string, fn: MethodHandler<LT>, override = true) {
    if (override || !this.methodHandlers.has(method))
      this.methodHandlers.set(method, fn)
    this.sendQueuedMessages(method, fn)
    return this
  }

  public onChanged(fn: MethodHandler<T>) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    return this.on('added', fn, false).on('changed', fn)
  }

  public onDeleted(fn: MethodHandler<T>) {
    return this.on('deleted', fn)
  }

  public getContentApi(config?: RestApiConfig) {
    if (!this.contentType.restEndpoint)
      throw new Error(
        `Content Api not configured for Content Type ${this.name}`
      )
    return new ContentAPI<T>(this.contentType.restEndpoint, config)
  }

  public get api() {
    // Cache an api instance with default settings
    if (!this._api) this._api = this.getContentApi(this.contentType.restConfig)
    return this._api
  }
}

/**
 * Default content type, providing a unified access to rest and socket api, workflow states and possibly roles.
 * Used for content that has pk and possibly state.
 */
export default class ContentType<
  T extends { pk: number; state?: string },
  Event extends string = string,
  Role extends string = string
> extends BaseContentType<T, Role> {
  private rolesAvailable?: ContextRole<Role>[]
  private _sm?: ReturnType<typeof useStateMachine<T & { state: string }, Event>>
  private _rolesApi?: ContentAPI<{
    pk: number
    user: IUser
    assigned: Role[]
  }>

  private get roles() {
    return this.contentType.roles?.definitions
  }

  public get rolesApi() {
    // Cache an api instance with default settings
    if (!this.contentType.roles) throw new Error('ContentType has no roles')
    if (!this._rolesApi)
      this._rolesApi = new ContentAPI(this.contentType.roles.endpoint)
    return this._rolesApi
  }

  public getRole(role: Role): ContextRoleDefinition {
    if (!this.roles) throw new Error('No role definitions available')
    return this.roles[role]
  }

  public updateMap(map: Map<number, T>, channelMap?: ChannelMap<T>) {
    if (channelMap) {
      contentCleanup.register(map, channelMap)
    }
    return this.onChanged((item) => map.set(item.pk, item)).onDeleted((item) =>
      map.delete(item.pk)
    )
  }

  /**
   * Cached state machine for this content type.
   */
  public get sm() {
    if (!this.contentType.states)
      throw new Error(
        `Content type ${this.name} has no registered state machine`
      )
    if (!this._sm)
      this._sm = useStateMachine<T & { state: string }, Event>(
        this.contentType.states.name,
        this.contentType.states.meta,
        this.api as ContentAPI<T & { state: string }, number>
      )
    return this._sm
  }

  public useContextRoles() {
    this.assertHasRoles()
    return useContextRoles<Role>(this.contentType.name)
  }

  // Moved from Channel

  private assertHasRoles(): void {
    if (!this.roles)
      throw new Error(
        `Content Type ${this.name} is not configured to have context roles.`
      )
  }

  public async getAvailableRoles(): Promise<ContextRole<Role>[]> {
    this.assertHasRoles()
    if (this.rolesAvailable) return this.rolesAvailable
    const { data } = await this.rolesApi.listAction<ContextRole<Role>[]>(
      'available',
      undefined,
      { method: 'get' }
    )
    this.rolesAvailable = data
    return data
  }

  public async fetchRoles(pk: number, users?: number[]) {
    const { setUser } = useUserDetails()
    const { set } = this.useContextRoles()
    const query = {
      context: pk,
      user_id_in: users
    }
    const { data } = await this.rolesApi.list(query)
    for (const { user, assigned } of data) {
      set(pk, user.pk, assigned)
      setUser(user)
    }
  }

  public addRoles(pk: number, user: number, ...roles: string[]) {
    return this.rolesApi.listAction('add', {
      [this.name]: pk,
      user,
      roles
    })
  }

  public removeRoles(pk: number, user: number, ...roles: string[]) {
    return this.rolesApi.listAction('remove', {
      [this.name]: pk,
      user,
      roles
    })
  }
}
