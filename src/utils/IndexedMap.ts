import { shallowReactive } from 'vue'

export type IndexKey = string | number
/**
 * Derives the index key(s) for an item. Return an array to index one item under
 * several keys (e.g. a poll indexed under each of its proposals), or undefined
 * to leave the item out of the index entirely.
 */
export type Indexer<T> = (item: T) => IndexKey | IndexKey[] | undefined
export type Indexers<T> = Record<string, Indexer<T>>

/**
 * A Map that maintains secondary indexes from item attributes to primary keys,
 * so that lookups like "all proposals in this agenda item" don't scan the whole map.
 *
 * Indexes are kept in sync by overriding set/delete/clear, which is the only choke
 * point every mutation shares — content types, store methods and contentCleanup all
 * write through them. Vue's collection handlers invoke these methods on the raw
 * instance, so the overrides run even when the map is wrapped in shallowReactive.
 *
 * Each index is shallowReactive, so a reader of one key is only invalidated when that
 * key changes — unlike iterating the map itself, where any write triggers every reader.
 *
 * Items must be *replaced* via set(), never mutated in place. Mutating an indexed
 * attribute on a stored object silently corrupts the index (and, under shallowReactive,
 * would not re-render anyway).
 *
 * @example
 * const proposals = shallowReactive(
 *   new IndexedMap({ agenda_item: (p: Proposal) => p.agenda_item })
 * )
 * proposals.by('agenda_item', 12) // Proposal[]
 */
export default class IndexedMap<T, Name extends string = string> extends Map<
  number,
  T
> {
  private readonly indexers: Record<Name, Indexer<T>>
  readonly indexes: Record<Name, Map<IndexKey, Set<number>>>

  constructor(indexers: Record<Name, Indexer<T>>) {
    super()
    this.indexers = indexers
    this.indexes = Object.fromEntries(
      Object.keys(indexers).map((name) => [
        name,
        shallowReactive(new Map<IndexKey, Set<number>>())
      ])
    ) as Record<Name, Map<IndexKey, Set<number>>>
  }

  private getIndex(name: Name) {
    const index = this.indexes[name]
    if (!index)
      throw new Error(`IndexedMap has no index named '${String(name)}'`)
    return index
  }

  /**
   * The keys an item belongs to in one index, normalised to an array.
   */
  private keysFor(name: Name, item: T): IndexKey[] {
    const keys = this.indexers[name](item)
    if (keys === undefined) return []
    return Array.isArray(keys) ? keys : [keys]
  }

  private link(name: Name, key: IndexKey, pk: number) {
    const index = this.indexes[name]
    let pks = index.get(key)
    if (!pks) index.set(key, (pks = shallowReactive(new Set<number>())))
    pks.add(pk)
  }

  private unlink(name: Name, key: IndexKey, pk: number) {
    const index = this.indexes[name]
    const pks = index.get(key)
    if (!pks) return
    pks.delete(pk)
    // Don't leave empty sets behind, or the index grows without bound.
    if (!pks.size) index.delete(key)
  }

  /**
   * Move pk from one set of index keys to another, touching only what changed.
   * Most updates leave the keys alone (a proposal changes state, not agenda item),
   * and skipping those keeps readers of the key from being invalidated needlessly.
   */
  private reindex(pk: number, previous: T | undefined, item: T | undefined) {
    for (const name of Object.keys(this.indexers) as Name[]) {
      const before = previous === undefined ? [] : this.keysFor(name, previous)
      const after = item === undefined ? [] : this.keysFor(name, item)
      if (before.length < 2 && after.length < 2) {
        // Single-key indexers are the common case — compare directly.
        if (before[0] === after[0]) continue
        if (before.length) this.unlink(name, before[0], pk)
        if (after.length) this.link(name, after[0], pk)
        continue
      }
      // Multi-key: an update usually leaves the list alone (a poll changes
      // state, not its proposals), so check that before building any Sets.
      if (
        before.length === after.length &&
        before.every((key, i) => key === after[i])
      )
        continue
      const afterKeys = new Set(after)
      const beforeKeys = new Set(before)
      for (const key of beforeKeys)
        if (!afterKeys.has(key)) this.unlink(name, key, pk)
      for (const key of afterKeys)
        if (!beforeKeys.has(key)) this.link(name, key, pk)
    }
  }

  set(pk: number, item: T) {
    this.reindex(pk, super.get(pk), item)
    return super.set(pk, item)
  }

  delete(pk: number) {
    this.reindex(pk, super.get(pk), undefined)
    return super.delete(pk)
  }

  clear() {
    for (const name of Object.keys(this.indexes) as Name[])
      this.indexes[name].clear()
    super.clear()
  }

  /**
   * Iterate items indexed under key. Prefer this over by() when counting or
   * testing existence, to avoid materialising an array.
   */
  *iterBy(name: Name, key: IndexKey): Generator<T> {
    const pks = this.getIndex(name).get(key)
    if (!pks) return
    for (const pk of pks) {
      const item = this.get(pk)
      // A pk with no item means the index outlived its entry; skip rather than throw.
      if (item !== undefined) yield item
    }
  }

  /**
   * All items indexed under key.
   */
  by(name: Name, key: IndexKey): T[] {
    return [...this.iterBy(name, key)]
  }
}
