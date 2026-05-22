import { isRef, MaybeRef, reactive, unref, watch } from 'vue'

import { MeetingRoles, OrganisationRoles } from '@/composables/types'
import restApi from '@/utils/restApi'
import { socket } from '@/utils/Socket'

import { IUser } from './types'

const userDetails = reactive(new Map<number, IUser>())

socket.addTypeHandler('user', ({ t, p }) => {
  const type = t.split('.')[1]
  switch (type) {
    case 'inv': {
      const { pk } = p as { pk: number }
      userDetails.delete(pk)
      break
    }
    default:
      console.warn(`Got unknown user message type '${type}'`)
  }
})

interface QueueContext {
  queue: Set<number>
  timeout?: NodeJS.Timeout
  loading: boolean
}

const TIMEOUT = 50
const contextQueues = new Map<string, QueueContext>()

function getContextKey(id: number | undefined): string {
  return id ? `meeting:${id}` : 'org'
}

function getOrCreateQueue(key: string): QueueContext {
  if (!contextQueues.has(key)) {
    contextQueues.set(key, { queue: new Set(), loading: false })
  }
  return contextQueues.get(key)!
}

async function fetchMultiple(key: string) {
  const ctx = getOrCreateQueue(key)
  const missing = [...ctx.queue].filter((pk) => !userDetails.has(pk))
  if (ctx.loading || !missing.length) return
  const ctxId = key === 'org' ? undefined : Number(key.split(':')[1])
  const ep = ctxId ? 'meeting-roles/' : 'organisation-roles/'
  const params = { context: ctxId, user_id_in: missing.join(',') }
  ctx.queue.clear()
  ctx.loading = true
  try {
    const { data } = await restApi.get<MeetingRoles[] | OrganisationRoles[]>(ep, { params })
    for (const { user } of data) {
      userDetails.set(user.pk, user)
    }
  } catch {}
  ctx.loading = false
  if (ctx.queue.size) fetchMultiple(key)
}

export default function useUserDetails(meetingId?: MaybeRef<number>) {
  if (isRef(meetingId))
    watch(meetingId, (_newId, oldId) => {
      const key = getContextKey(oldId || undefined)
      const ctx = contextQueues.get(key)
      if (ctx) {
        ctx.queue.clear()
        clearTimeout(ctx.timeout)
      }
    })

  function fetchUserDetails(user: number) {
    // Avoid getting participants in several requests by queueing, and setting a short timeout.
    const ctxId = unref(meetingId) || undefined
    const key = getContextKey(ctxId)
    const ctx = getOrCreateQueue(key)
    if (!ctx.queue.has(user)) {
      ctx.queue.add(user)
      clearTimeout(ctx.timeout)
      ctx.timeout = setTimeout(() => fetchMultiple(key), TIMEOUT)
    }
  }

  /**
   * To be used in computed objects. Returns user object if in storage.
   * If not in storage, fetch user from API, using queue system.
   * @param user User primary key
   */
  function getUser(user: number) {
    // Queue for fetch if not in store
    if (!userDetails.has(user)) fetchUserDetails(user)
    return userDetails.get(user)
  }

  function setUser(user: IUser) {
    userDetails.set(user.pk, user)
  }

  return {
    getUser,
    setUser
  }
}
