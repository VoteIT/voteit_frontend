import type { ValueOf } from '@/utils/types'
import type {
  Heartbeat,
  IChannelsMessage,
  SocketOptions,
  SocketState,
  TypeHandler
} from './types'

type ReadyState = ValueOf<typeof SocketState>
type ReadyStateHandler = (readyState: ReadyState) => void

const BATCH_ACTION = 'batch'

/** Payload of a '<action>.batch' message: several payloads of <action>. */
interface BatchPayload {
  items: object[]
}

export default class Socket {
  private readyStateHandlers: Set<ReadyStateHandler>
  private heartbeats: Heartbeat[]
  private options: SocketOptions
  private _readyState?: ReadyState // last readyState value
  private typeHandlers: Map<string, Set<TypeHandler>>
  private url: string | URL
  private ws?: WebSocket

  constructor(url: string | URL, opts?: SocketOptions) {
    this.readyStateHandlers = new Set()
    this.heartbeats = []
    this.options = opts || {}
    this.typeHandlers = new Map()
    this.url = url
    if (!opts?.manual) this.connect()
  }

  public get readyState() {
    return this.ws?.readyState as ReadyState
  }

  /**
   * Listen to ready state changes
   * @param handler Callback to handle changes
   * @returns dispose method
   */
  public onReadyStateChanged(handler: ReadyStateHandler) {
    this.readyStateHandlers.add(handler)
    return () => {
      this.readyStateHandlers.delete(handler)
    }
  }

  /**
   * Registers a type listener...
   * @param name Type name
   * @param handler Event handler
   * @returns dispose method - call to remove handler
   */
  public registerTypeHandler(name: string, handler: TypeHandler) {
    if (!this.typeHandlers.has(name)) this.typeHandlers.set(name, new Set())
    const handlers = this.typeHandlers.get(name)!
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  }

  private updateReadyState() {
    if (this.readyState === undefined || this._readyState === this.readyState)
      return
    this._readyState = this.readyState
    for (const handler of this.readyStateHandlers) handler(this.readyState)
  }

  public connect() {
    this.ws = new WebSocket(this.url)
    this.updateReadyState()

    this.ws.onerror = this.updateReadyState.bind(this)
    this.ws.onclose = () => {
      this.updateReadyState()
      this.heartbeat('off')
    }
    this.ws.onopen = () => {
      this.updateReadyState()
      this.heartbeat('incoming')
      this.heartbeat('outgoing')
    }
    this.ws.onmessage = (event) => {
      this.updateReadyState()
      this.heartbeat('incoming')
      const msg: IChannelsMessage = JSON.parse(event.data)

      // Handle type message
      this.handleTypeMessage(msg)
    }
  }

  private handleTypeMessage(msg: IChannelsMessage) {
    const [type, ...action] = msg.action.split('.')
    const handlers = this.typeHandlers.get(type)
    if (!handlers) {
      if (this.options.debug)
        console.warn(`No handler for message of type '${type}'`)
      return
    }
    const messages = this.unpack(action, msg.payload)
    for (const handler of handlers) for (const m of messages) handler(m)
  }

  /**
   * Split a message into the messages handlers should see. Everything but a
   * batch is a single message; a '<action>.batch' carries several payloads of
   * <action> that the backend collapsed into one frame, so handlers get those
   * one by one with the batch part stripped off. Takes the action already
   * split into its parts, minus the type.
   */
  private unpack(action: string[], payload: object): IChannelsMessage[] {
    if (action.at(-1) !== BATCH_ACTION)
      return [{ action: action.join('.'), payload }]
    const { items } = payload as Partial<BatchPayload>
    if (!Array.isArray(items)) {
      console.error(`Batch message '${action.join('.')}' has no items`, payload)
      return []
    }
    const batched = action.slice(0, -1).join('.')
    return items.map((item) => ({ action: batched, payload: item }))
  }

  public close() {
    // Unregister listeners here?
    if (!this.ws) return
    this.ws.onopen = () => {
      throw new Error('Undead socket detected')
    }
    this.ws.onmessage = null
    this.ws.onerror = null
    this.ws.onclose = null
    this.ws.close()
    this.updateReadyState()
  }

  public get isOpen() {
    return this.readyState === WebSocket.OPEN
  }

  private async assertOpen() {
    if (!this.isOpen)
      throw new Error(`Socket not open (readyState ${this.readyState})`)
  }

  /**
   * Send a message to server, without listening to response
   * @param action action name
   * @param payload payload
   */
  public send(action: string, payload?: object) {
    // Does not register a response listener
    this.assertOpen()
    this.heartbeat('outgoing')
    this.ws?.send(JSON.stringify({ action, payload }))
  }

  public removeHeartbeat(callback: Heartbeat['callback']) {
    const finder = (beat: Heartbeat) => beat.callback === callback
    const heartbeat = this.heartbeats.find(finder)
    if (!heartbeat) return
    // Clear timeout and drop from heartbeats
    clearInterval(heartbeat.intervalID)
    this.heartbeats = this.heartbeats.filter((beat) => !finder(beat))
  }

  private heartbeat(direction: NonNullable<Heartbeat['direction']> | 'off') {
    if (direction === 'off') {
      for (const beat of this.heartbeats) clearInterval(beat.intervalID)
      return
    }
    for (const heartbeat of this.heartbeats) {
      // Skip if heartbeat has a direction that doesn't match
      if (heartbeat.direction && heartbeat.direction !== direction) continue
      // Reset interval
      clearInterval(heartbeat.intervalID)
      heartbeat.intervalID = setInterval(
        () => heartbeat.callback(this),
        heartbeat.ms
      )
    }
  }
}
