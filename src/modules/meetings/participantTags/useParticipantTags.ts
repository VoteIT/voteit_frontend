import { ifilter, map } from 'itertools'
import { computed, MaybeRef, shallowReactive, unref } from 'vue'

import { participantTagsType } from './contentTypes'
import type { AllTagsPayload, TagChangedPayload } from './types'

// meeting -> user -> tag[]. Both levels are shallow, so the inner Map must be made
// reactive explicitly - values read out of a shallowReactive container are raw.
const tagStore = shallowReactive(new Map<number, Map<number, string[]>>())

function* iterTags(tags: TagChangedPayload['tags']): Generator<string> {
  for (const [ns, tag] of Object.entries(tags)) {
    const tags = Array.isArray(tag) ? tag : [tag]
    for (const t of tags) yield `${ns}:${t}`
  }
}

function getMeetingStore(m: number) {
  if (!tagStore.has(m)) tagStore.set(m, shallowReactive(new Map()))
  return tagStore.get(m)!
}

participantTagsType.on<AllTagsPayload>('all', ({ meeting, tags }) => {
  const store = getMeetingStore(meeting)
  for (const [tag, users] of Object.entries(tags)) {
    for (const user of users) {
      const existing = store.get(user) ?? []
      store.set(user, [...existing, tag])
    }
  }
})

participantTagsType.on<TagChangedPayload>(
  'changed',
  ({ meeting, tags, user }) => {
    const store = getMeetingStore(meeting)
    store.set(user, [...iterTags(tags)])
  }
)

export default function useParticipantTags(meeting: MaybeRef<number>) {
  const users = computed(() => getMeetingStore(unref(meeting)))

  /**
   * Get user ids that has a specific tag in this meeting.
   */
  function getTagUsers(tag: string) {
    return map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ifilter(users.value.entries(), ([_, tags]) => tags.includes(tag)),
      ([user]) => user
    )
  }

  /**
   * Get tags for a user in this meeting.
   * @param user User ID
   * @param namespace Optional namespace to filter tags on
   * @returns
   */
  function getUserTags(user: number, namespace?: string) {
    const tags = users.value.get(user) ?? []
    if (!namespace) return tags
    return namespace ? tags.filter((t) => t.split(':')[0] === namespace) : tags
  }

  function removeNamespace(ns: string[]) {
    return participantTagsType.api.action('remove-ns', unref(meeting), { ns })
  }

  function setTags(namespace: string, tags: string | string[]) {
    return participantTagsType.api.action('set', unref(meeting), {
      tags: { [namespace]: tags }
    })
  }

  return {
    getTagUsers,
    getUserTags,
    removeNamespace,
    setTags
  }
}
