import { computed, effect, shallowReactive } from 'vue'
import { describe, expect, test } from 'vitest'

import IndexedMap from './IndexedMap'

interface Proposal {
  pk: number
  agenda_item: number
  tags: string[]
}

function proposal(pk: number, agenda_item: number, tags: string[] = []) {
  return { pk, agenda_item, tags }
}

function makeMap() {
  return new IndexedMap({
    agenda_item: (p: Proposal) => p.agenda_item,
    tags: (p: Proposal) => p.tags
  })
}

function pks<T extends { pk: number }>(items: T[]) {
  return items.map((i) => i.pk).sort()
}

describe('IndexedMap', () => {
  test('indexes items on insert', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10))
    map.set(2, proposal(2, 10))
    map.set(3, proposal(3, 20))

    expect(pks(map.by('agenda_item', 10))).toEqual([1, 2])
    expect(pks(map.by('agenda_item', 20))).toEqual([3])
    expect(map.size).toBe(3)
  })

  test('re-indexes when an item moves to another key', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10))
    map.set(2, proposal(2, 10))

    map.set(1, proposal(1, 20))

    expect(pks(map.by('agenda_item', 10))).toEqual([2])
    expect(pks(map.by('agenda_item', 20))).toEqual([1])
  })

  test('unlinks on delete', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10))
    map.set(2, proposal(2, 10))

    expect(map.delete(1)).toBe(true)

    expect(pks(map.by('agenda_item', 10))).toEqual([2])
    expect(map.has(1)).toBe(false)
    // Deleting a missing key is a no-op, not a crash
    expect(map.delete(99)).toBe(false)
  })

  test('clear empties both the map and every index', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10, ['a']))
    map.set(2, proposal(2, 20, ['b']))

    map.clear()

    expect(map.size).toBe(0)
    expect(map.by('agenda_item', 10)).toEqual([])
    expect(map.by('tags', 'a')).toEqual([])
    expect(map.indexes.agenda_item.size).toBe(0)
    expect(map.indexes.tags.size).toBe(0)
  })

  test('supports multi-key indexers', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10, ['red', 'blue']))
    map.set(2, proposal(2, 10, ['blue']))

    expect(pks(map.by('tags', 'blue'))).toEqual([1, 2])
    expect(pks(map.by('tags', 'red'))).toEqual([1])

    // Dropping one tag unlinks only that key
    map.set(1, proposal(1, 10, ['blue']))
    expect(map.by('tags', 'red')).toEqual([])
    expect(pks(map.by('tags', 'blue'))).toEqual([1, 2])
  })

  test('skips items whose indexer returns undefined', () => {
    const map = new IndexedMap({
      poll: (v: { pk: number; poll?: number }) => v.poll
    })
    map.set(1, { pk: 1, poll: 5 })
    map.set(2, { pk: 2 })

    expect(pks(map.by('poll', 5))).toEqual([1])
    expect(map.size).toBe(2)
    expect(map.indexes.poll.size).toBe(1)
  })

  test('returns an empty array for an unknown key', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10))

    expect(map.by('agenda_item', 999)).toEqual([])
    expect([...map.iterBy('agenda_item', 999)]).toEqual([])
  })

  test('throws on an unknown index name', () => {
    const map = makeMap()
    // @ts-expect-error -- unknown index names are a type error too
    expect(() => map.by('nope', 1)).toThrow(/no index named 'nope'/)
  })

  test('does not retain empty key sets', () => {
    const map = makeMap()
    map.set(1, proposal(1, 10))
    expect(map.indexes.agenda_item.size).toBe(1)

    map.delete(1)
    expect(map.indexes.agenda_item.size).toBe(0)
  })

  test('indexes stay in sync when mutated through a shallowReactive proxy', () => {
    // contentCleanup and the stores both write through the proxy, not the raw instance.
    const map = shallowReactive(makeMap())
    map.set(1, proposal(1, 10))
    map.set(2, proposal(2, 20))
    map.delete(2)

    expect(pks(map.by('agenda_item', 10))).toEqual([1])
    expect(map.by('agenda_item', 20)).toEqual([])
  })

  test('an unchanged multi-key list does not churn the index', () => {
    // Re-linking every key on every write would invalidate all of a poll's
    // proposals whenever the poll changed state. Nothing should fire here.
    const map = shallowReactive(makeMap())
    map.set(1, proposal(1, 10, ['red', 'blue']))

    // Watch the index itself, not by() — by() resolves items, so it depends on
    // the item's own key and would re-run for any edit to it.
    let runs = 0
    const reader = computed(() => {
      runs++
      return map.indexes.tags.get('blue')?.size ?? 0
    })
    effect(() => reader.value)
    const before = runs

    // Same tags, different agenda item — the tags index must not be touched
    map.set(1, proposal(1, 11, ['red', 'blue']))
    reader.value

    expect(runs).toBe(before)
    expect(pks(map.by('tags', 'blue'))).toEqual([1])

    // Changing the tags does re-run it
    map.set(1, proposal(1, 11, ['red']))
    reader.value
    expect(runs).toBeGreaterThan(before)
    expect(map.by('tags', 'blue')).toEqual([])
  })

  test('a reader of one key is not invalidated by changes to another', () => {
    // This is the property the whole class exists to provide: without it the
    // lookups are correct but every update still re-runs every reader.
    const map = shallowReactive(makeMap())
    for (let ai = 0; ai < 5; ai++)
      for (let n = 0; n < 3; n++)
        map.set(ai * 10 + n, proposal(ai * 10 + n, ai))

    const runs = [0, 0, 0, 0, 0]
    const counts = runs.map((_, ai) =>
      computed(() => {
        runs[ai]++
        return map.by('agenda_item', ai).length
      })
    )
    counts.forEach((c) => effect(() => c.value))
    const before = [...runs]

    // Update an existing item in agenda item 3, without changing its key.
    // Only that agenda item's reader re-runs, and only once — the index itself
    // is left untouched, so the single trigger comes from the item's own pk.
    map.set(30, proposal(30, 3))
    counts.forEach((c) => c.value)

    expect(runs.map((r, i) => r - before[i])).toEqual([0, 0, 0, 1, 0])

    // Moving an item re-runs exactly the source and destination readers
    const beforeMove = [...runs]
    map.set(31, proposal(31, 4))
    counts.forEach((c) => c.value)

    const reran = runs
      .map((r, i) => r - beforeMove[i])
      .map((delta, ai) => ({ ai, delta }))
      .filter(({ delta }) => delta > 0)
      .map(({ ai }) => ai)
    expect(reran).toEqual([3, 4])
    expect(counts[3].value).toBe(2)
    expect(counts[4].value).toBe(4)
  })
})
