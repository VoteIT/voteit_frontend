/*
 * Acts as FIFO cache if you construct using number to keep in cache as second argument
 */
export default class DefaultMap<K, T> extends Map<K, T> {
  default: (key: K) => any
  cacheSize?: number

  get (key: K): T {
    if (!this.has(key)) {
      // Keys are ordered by insertion order, so this deletes oldest key.
      if (this.cacheSize && this.size >= this.cacheSize) this.delete(this.keys().next().value)
      this.set(key, this.default(key))
    }
    return super.get(key) as T
  }

  constructor (defaultFunction: (key: K) => T, cacheSize?: number) {
    super()
    this.default = defaultFunction
    this.cacheSize = cacheSize
  }
}
