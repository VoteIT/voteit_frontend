import { Progress, ProgressHandler } from './types'

const PROGRESS_INITIAL: Progress = {
  curr: 0,
  total: 1
}

export default class ProgressPromise<
  T,
  PT extends Progress = Progress
> extends Promise<T> {
  private currProgress: Progress
  private listeners: Set<ProgressHandler<PT>>

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
      progress: (progress: PT) => void
    ) => void
  ) {
    const setProgress = (progress: PT) => {
      ;(async () => {
        // We wait for the next microtask tick so `super` is called before we use `this`
        await Promise.resolve()

        // Note: we don't really have guarantees over
        // the order in which async operations are evaluated,
        // so if we get an out-of-order progress, we won't save it.
        if (progress.curr >= this.currProgress.curr)
          this.currProgress = progress
        for (const listener of this.listeners) {
          listener(progress)
        }
      })()
    }

    super(
      (
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
      ) => {
        executor(resolve, reject, setProgress)
      }
    )

    this.listeners = new Set()
    this.currProgress = PROGRESS_INITIAL
  }

  get progress() {
    return this.currProgress
  }

  public onProgress(callback: ProgressHandler<PT>) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Expected a \`Function\`, got \`${typeof callback}\``)
    }

    this.listeners.add(callback)
    return this
  }
}
