export interface Listener<T> {
  (evt: T): any
}

export interface Disposable {
  dispose(): void
}

/** passes through events as they happen. You will not get events from before you start listening */
export default class TypedEvent<T> {
  private listeners: Set<Listener<T>> = new Set()
  private listenerOnces: Set<Listener<T>> = new Set()

  on = (listener: Listener<T>): Disposable => {
    this.listeners.add(listener)
    return {
      dispose: () => this.off(listener)
    }
  }

  once = (listener: Listener<T>): void => {
    this.listenerOnces.add(listener)
  }

  off = (listener: Listener<T>) => {
    this.listeners.delete(listener)
  }

  emit = (evt: T) => {
    /** Update any listeners */
    for (const listener of this.listeners) listener(evt)
    for (const listener of this.listenerOnces) listener(evt)
    /** Clear the `once` queue */
    this.listenerOnces.clear()
  }

  pipe = (te: TypedEvent<T>): Disposable => {
    return this.on(evt => te.emit(evt))
  }
}
