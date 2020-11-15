export default class ProgressPromise extends Promise {
  constructor (executor) {
    const setProgress = progress => {
      (async () => {
        // We wait for the next microtask tick so `super` is called before we use `this`
        await Promise.resolve()

        // Note: we don't really have guarantees over
        // the order in which async operations are evaluated,
        // so if we get an out-of-order progress, we'll just discard it.
        if (progress.curr <= this._progress.curr) {
          return
        }

        this._progress = progress

        for (const listener of this._listeners) {
          listener(progress)
        }
      })()
    }

    super((resolve, reject) => {
      executor(
        value => {
          resolve(value)
        },
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

  onProgress (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
    }

    this._listeners.add(callback)
    return this
  }
}
