import { Progress, ProgressHandler } from './types'

export default class ProgressPromise<T> extends Promise<T> {
  _progress: Progress
  _listeners: Set<ProgressHandler>
  _setProgress: ProgressHandler

  constructor (
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
      progress: (progress: Progress) => void
    ) => void) {
    const setProgress = (progress: Progress) => {
      (async () => {
        // We wait for the next microtask tick so `super` is called before we use `this`
        await Promise.resolve()

        // Note: we don't really have guarantees over
        // the order in which async operations are evaluated,
        // so if we get an out-of-order progress, we'll just discard it.
        if (typeof progress === 'number' && progress <= this._progress) {
          return
        } else if (typeof progress === 'object' && typeof this._progress === 'object' && progress.curr <= this._progress.curr) {
          return
        }

        this._progress = progress

        for (const listener of this._listeners) {
          listener(progress)
        }
      })()
    }

    super((
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => {
      executor(
        resolve,
        reject,
        setProgress
      )
    })

    this._listeners = new Set()
    this._setProgress = setProgress
    this._progress = 0
  }

  get progress () {
    return this._progress
  }

  public onProgress (callback: ProgressHandler) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
    }

    this._listeners.add(callback)
    return this
  }
}
