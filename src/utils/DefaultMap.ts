export default class DefaultMap<K, T> extends Map<K, T> {
  default: () => any

  get (key: K): T {
    if (!this.has(key)) this.set(key, this.default())
    return super.get(key) as T
  }

  constructor (defaultFunction: () => T) {
    super()
    this.default = defaultFunction
  }
}
