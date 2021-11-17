/* eslint-disable no-unused-expressions */
import { uriToPayload, ProgressPromise, DefaultMap } from '@/utils'
import hostname from '@/utils/hostname'
import { AlertLevel } from '@/composables/types'

import { ChannelsConfig, ChannelsMessage, State, SuccessMessage } from './types'
import { openAlertEvent } from './events'

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'

type SocketEventHandler = (event: MessageEvent | Event | CloseEvent) => void

const DEFAULT_CONFIG: ChannelsConfig = {
  timeout: 5_000 // 5s
}
export enum SocketEvent {
  Open = 'open',
  Close = 'close',
  Error = 'error',
  Message = 'message'
}

export default class Socket {
  public active: boolean
  private callbacks: Map<string, (data: ChannelsMessage) => void>
  private listeners: DefaultMap<string, Set<SocketEventHandler>>
  private ws?: WebSocket

  constructor () {
    this.active = false
    this.callbacks = new Map()
    this.listeners = new DefaultMap(() => new Set())
  }

  private createEventListener (eventName: SocketEvent): SocketEventHandler {
    return (event) => {
      for (const listener of this.listeners.get(eventName)) {
        listener(event)
      }
    }
  }

  public addEventListener (eventName: SocketEvent, listener: SocketEventHandler) {
    this.listeners.get(eventName).add(listener)
  }

  public removeEventListener (eventName: SocketEvent, listener: SocketEventHandler) {
    this.listeners.get(eventName).delete(listener)
  }

  public connect () {
    this.active = true
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${wsProtocol}//${hostname}/ws/`)

      this.ws.addEventListener(SocketEvent.Error, reject)
      this.ws.addEventListener(SocketEvent.Open, resolve)
      this.ws.addEventListener(SocketEvent.Message, event => {
        const data: ChannelsMessage = JSON.parse(event.data)
        if (data.i) this.callbacks.get(data.i)?.(data)
      })
      this.ws.onopen = this.createEventListener(SocketEvent.Open)
      this.ws.onmessage = this.createEventListener(SocketEvent.Message)
      this.ws.onerror = this.createEventListener(SocketEvent.Error)
      this.ws.onclose = this.createEventListener(SocketEvent.Close)
      // for (const event of Object.values(SocketEvent)) {
      //   this.ws.addEventListener(event, this.createEventListener(event))
      // }
    })
  }

  public close () {
    // Unregister listeners here?
    this.active = false
    if (!this.ws) return
    this.ws.onopen = () => { throw new Error('Undead socket detected') }
    this.ws.onmessage = null
    this.ws.onerror = null
    this.ws.onclose = null
    this.ws.close()
  }

  public get isOpen () {
    return this.active && this.ws?.readyState === WebSocket.OPEN
  }

  private assertOpen () {
    if (!this.active) throw new Error('Socket not activated')
    if (this.ws?.readyState !== WebSocket.OPEN) throw new Error('Socket closed')
  }

  public call<T> (type: string, payload?: object, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>>
  public call<T> (type: string, uri: string, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>>
  public call<T> (type: string, payloadOrUri?: string | object, config?: ChannelsConfig): ProgressPromise<SuccessMessage<T>> {
    // Registers a response listener and returns promise that resolves or rejects depeding on subsequent
    // socket data, or times out.
    this.assertOpen()
    const myConfig: ChannelsConfig = { ...DEFAULT_CONFIG, ...(config || {}) }
    const messageId: string = sessionStorage.socketMessageCounter || '1'
    const payload = payloadOrUri && (typeof payloadOrUri === 'object'
      ? payloadOrUri
      : uriToPayload(payloadOrUri))
    this.ws?.send(JSON.stringify({
      t: type,
      p: payload,
      i: messageId
    }))
    sessionStorage.socketMessageCounter = Number(messageId) + 1
    return new ProgressPromise((resolve, reject, progress) => {
      let timeoutId: number
      const setRejectTimeout = () => {
        if (myConfig.timeout) {
          timeoutId = setTimeout(() => {
            this.callbacks.delete(messageId)
            if (myConfig.alertOnError) {
              openAlertEvent.emit({
                title: 'Socket error',
                text: 'Request timed out',
                level: AlertLevel.Error,
                sticky: true
              })
            }
            reject(new Error('Request timed out'))
          }, myConfig.timeout)
        }
      }
      setRejectTimeout()

      this.callbacks.set(messageId, data => {
        clearTimeout(timeoutId)
        switch (data.s) {
          case State.Failed:
            this.callbacks.delete(messageId)
            if (myConfig.alertOnError) {
              openAlertEvent.emit({
                title: 'Socket error',
                text: data.p.msg,
                level: AlertLevel.Error,
                sticky: true
              })
            }
            reject(new Error(data.p.msg))
            break
          case State.Waiting:
          case State.Running:
            // If we get progress, we reset timeout watcher
            setRejectTimeout()
            progress(data.p)
            break
          case State.Success:
            this.callbacks.delete(messageId)
            resolve(data as SuccessMessage<T>)
            break
          default: // Should never happen
            this.callbacks.delete(messageId)
            reject(new Error(`Unknown socket state: ${data}`))
        }
      })
    })
  }

  public send (type: string, payloadOrUri: string | object) {
    // Does not register a response listener
    this.assertOpen()
    const payload = typeof payloadOrUri === 'object'
      ? payloadOrUri
      : uriToPayload(payloadOrUri)
    this.ws?.send(JSON.stringify({
      t: type,
      p: payload
    }))
  }

  public respond (type: string, id: string | null, state: State = State.Success, payload?: object) {
    this.assertOpen()
    this.ws?.send(JSON.stringify({
      t: type,
      i: id,
      p: payload,
      s: state
    }))
  }
}
