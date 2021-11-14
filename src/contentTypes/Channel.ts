import { ref } from 'vue'

import { DefaultMap, Socket } from '@/utils'
import { SubscribedMessage, SuccessMessage } from '@/utils/types'

import { ChannelConfig, SchemaType } from './types'
import { ContextRole } from '@/composables/types'
import { AvailableRolesPayload, ContextRolesPayload, RoleChangeMessage, RolesAvailableMessage, RolesGetMessage } from './messages'

type LeaveHandler = (uriOrPk: string | number) => void
type UpdateHandler<T> = (message: SuccessMessage<T>) => void
type MethodHandler<T> = (item: T) => void

const DEFAULT_CONFIG: ChannelConfig = {
  alertOnError: true,
  leaveDelay: 10000 // Delay before leaving channel in ms
}

const socket = new Socket()
export const socketState = ref(false)
const subscriptions = new Set<string>()
const leaveTimeouts = new Map<string, number>()
const updateHandlers = new Map<string, UpdateHandler<any>>()
const leaveHandlers = new DefaultMap<string, LeaveHandler[]>(() => [])
const methodHanders = new DefaultMap<string, Map<string, MethodHandler<any>>>(() => new Map())
const ignoreContentTypes = new Set(['testing', 'channel', 'response'])
const rolesAvailable = new Map<string, ContextRole[]>()

function handleMessage (data: SuccessMessage<object>) {
  const [contentType, method] = data.t.split('.')
  const updateHandler = updateHandlers.get(contentType)
  // General update handler takes overrides other handlers
  if (updateHandler) return updateHandler(data)

  const handler = methodHanders.get(method).get(contentType)
  if (handler) {
    // Method handler only needs payload
    handler(data.p)
  } else if (!ignoreContentTypes.has(contentType)) {
    console.info('No registered update handler for content type', contentType)
  }
}

socket.addEventListener('message', event => {
  if ('data' in event) {
    handleMessage(JSON.parse(event.data))
  }
})

async function subscribeChannel (uri: string) {
  const response = await socket.call('channel.subscribe', uri) as SubscribedMessage
  const appState = response.p.app_state
  if (appState) appState.forEach(handleMessage)
  return response
}

// Send all subscription messages on connect
socket.addEventListener('open', () => {
  socketState.value = true
  subscriptions.forEach(subscribeChannel)
})

socket.addEventListener('close', () => {
  socketState.value = false
})

export default class Channel<T> {
  private _contentType?: string
  private hasRoles?: boolean
  private config: ChannelConfig

  get contentType (): string {
    if (this._contentType) {
      return this._contentType
    }
    throw new Error('Instantiate using useChannels(contentType) to use this method')
  }

  get socketState () {
    return socketState
  }

  constructor (contentType?: string, config?: ChannelConfig, hasRoles?: boolean) {
    this._contentType = contentType
    this.hasRoles = hasRoles
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) }
  }

  connect () {
    return socket.connect()
  }

  disconnect () {
    socket.close()
  }

  public onUpdate (fn: UpdateHandler<T>) {
    // If this is registered, no other callbacks will be used (onChanged, etc...)
    console.log('registering update handler for', this.contentType)
    updateHandlers.set(this.contentType, fn)
    return this
  }

  public onLeave (fn: LeaveHandler) {
    leaveHandlers.get(this.contentType).push(fn)
    return this
  }

  public on<Type> (this: Channel<T>, method: string, fn: MethodHandler<Type>, override = true): Channel<T> {
    const ctHandlers = methodHanders.get(method)
    if (override || !ctHandlers.has(this.contentType)) {
      ctHandlers.set(this.contentType, fn)
    }
    return this
  }

  private registerTypeHandler<HT=T> (this: Channel<T>, method: string, fn: MethodHandler<HT>, override = true) {
    const ctHandlers = methodHanders.get(method)
    if (override || !ctHandlers.has(this.contentType)) {
      methodHanders.get(method).set(this.contentType, fn)
    }
    return this
  }

  public onAdded = (fn: MethodHandler<T>) => this.registerTypeHandler<T>('added', fn)
  public onDeleted = (fn: MethodHandler<T>) => this.registerTypeHandler<T>('deleted', fn)
  public onStatus<ST=T> (fn: MethodHandler<ST>) {
    return this.registerTypeHandler<ST>('status', fn)
  }

  public onChanged (fn: MethodHandler<T>) {
    // By default, send add events to change method. Register using .onAdded(fn) to handle separately.
    return this.registerTypeHandler<T>('added', fn, false)
      .registerTypeHandler<T>('changed', fn)
  }

  public updateMap (map: Map<number, T>, transform = (value: T) => value): Channel<T> {
    // Convenience method to set onChanged and onDeleted to update Map object.
    return this.onChanged((item: any) => map.set(item.pk, transform(item)))
      .onDeleted((item: any) => map.delete(item.pk))
  }

  private getUri (uriOrPk?: string | number): string {
    // Allow channel subscriptions using contentType[/pk]
    switch (typeof uriOrPk) {
      case 'undefined':
        return this.contentType
      case 'number':
        return `${this.contentType}/${uriOrPk}`
    }
    return uriOrPk
  }

  public async subscribe (uriOrPk: string | number, fail = false) {
    const uri = this.getUri(uriOrPk)
    clearTimeout(leaveTimeouts.get(uri))
    if (subscriptions.has(uri)) return
    subscriptions.add(uri)
    if (socket.isOpen) return subscribeChannel(uri)
    if (fail) throw new Error('Socket closed. Cannot subscribe.')
  }

  private performLeave (uri: string): void {
    // Delete from subscriptions when sending unsubscribe request.
    subscriptions.delete(uri)
    if (socket.isOpen) {
      socket.send('channel.leave', uri)
    }
    // Call onLeave handlers... (Does not wait for response...)
    const [contentType] = uri.split('/')
    for (const cb of leaveHandlers.get(contentType) || []) {
      cb(uri)
    }
  }

  public async leave (uri: string, config?: ChannelConfig): Promise<void>
  public async leave (pk: number, config?: ChannelConfig): Promise<void>
  public async leave (uriOrPk: string | number, config?: ChannelConfig): Promise<void> {
    const myConfig: ChannelConfig = { ...this.config, ...(config || {}) }
    const uri = this.getUri(uriOrPk)
    clearTimeout(leaveTimeouts.get(uri))
    if (!subscriptions.has(uri)) return
    if (!myConfig.leaveDelay) return this.performLeave(uri)

    return new Promise(resolve => {
      // Will not resolve if canceled...
      leaveTimeouts.set(uri, setTimeout(() => {
        // New subscribtions will clear this timeout.
        this.performLeave(uri)
        resolve()
      }, myConfig.leaveDelay))
    })
  }

  // Wrap call and handle request errors (Timeout only?)
  private call<RT=unknown> (uri: string, data?: object, config?: ChannelConfig) {
    config = { ...this.config, ...(config || {}) }
    return socket.call<RT>(uri, data, config)
  }

  public post<RT=unknown> (uri: string, data?: object, config?: ChannelConfig) {
    return this.call<RT>(uri, data, config)
  }

  public send (type: string, payloadOrUri: string | object) {
    return socket.send(type, payloadOrUri)
  }

  public methodCall (method: string, data: object, config?: ChannelConfig) {
    return this.call(`${this.contentType}.${method}`, data, config)
  }

  public get = (pk: number, config?: ChannelConfig) => this.methodCall('get', { pk }, config)
  public add = (data: Partial<T>, config?: ChannelConfig) => this.methodCall('add', data, config)
  // TODO Deprecate this:
  contextAdd = (contextPk: number, kwargs: Partial<T>, config?: ChannelConfig) => this.methodCall('add', { pk: contextPk, kwargs }, config)
  public change = (pk: number, kwargs: Partial<T>, config?: ChannelConfig) => this.methodCall('change', { pk, kwargs }, config)
  public delete = (pk: number, config?: ChannelConfig) => this.methodCall('delete', { pk }, config)

  private checkHasRoles (): void {
    if (!this.hasRoles) throw new Error(`Content Type ${this._contentType} is not configured to have context roles.`)
  }

  public async getAvailableRoles (): Promise<ContextRole[]> {
    this.checkHasRoles()
    let roles = rolesAvailable.get(this.contentType)
    if (!roles) {
      const message: RolesAvailableMessage = { model: this.contentType }
      const response = await this.call('roles.available', message)
      const payload = response.p as AvailableRolesPayload
      roles = payload.roles
      rolesAvailable.set(this.contentType, payload.roles)
    }
    return roles
  }

  public async fetchRoles (pk: number, users?: number[]) {
    this.checkHasRoles()
    const message: RolesGetMessage = {
      model: this.contentType,
      pk,
      filter_userids: users
    }
    return this.call<ContextRolesPayload>('roles.get', message)
  }

  private changeRoles (method: string, pk: number, user: number, roles: string[]) {
    this.checkHasRoles()
    const message: RoleChangeMessage = {
      model: this.contentType,
      pk,
      userids: [user],
      roles
    }
    return this.call(method, message)
  }

  public addRoles (pk: number, user: number, ...roles: string[]) {
    return this.changeRoles('roles.add', pk, user, roles)
  }

  public removeRoles (pk: number, user: number, ...roles: string[]) {
    return this.changeRoles('roles.remove', pk, user, roles)
  }

  // eslint-disable-next-line camelcase
  public getSchema (message_type: string, type: SchemaType = SchemaType.Incoming) {
    return this.post('schema.get_' + type, { message_type })
  }
}
