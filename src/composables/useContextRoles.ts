import { map } from 'itertools'
import { shallowReactive } from 'vue'

import ContentType from '@/contentTypes/ContentType'
import useAuthStore from '@/modules/auth/useAuthStore'

import { ContextRoles, UserContextRoles } from './types'

// Shallow: only the Map itself is tracked, so role Sets must be replaced, never mutated in place.
const contextRoles = shallowReactive(new Map<string, Set<string>>())

/**
 * Role keys encode a (contentType, objectPk, userPk) triple as a slash-delimited string.
 * Format: "<contentType>/<objectPk>/<userId>"  e.g. "organisation/123/456"
 * When userId is '' the key is used as a prefix to query all users on an object.
 */
function getRoleKey(...components: [string, number, number | '']) {
  return components.join('/')
}

function hasRoleKey(p: ContextRoles): boolean {
  const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
  return contextRoles.has(key)
}

function getRoleStore(p: ContextRoles): { key: string; store: Set<string> } {
  const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
  return {
    key,
    store: contextRoles.get(key) ?? new Set()
  }
}

new ContentType<ContextRoles>({ name: 'roles' })
  .on('removed', (payload) => {
    if (!hasRoleKey(payload)) return
    const { store, key } = getRoleStore(payload)
    const remaining = new Set(store)
    payload.roles.forEach((r) => remaining.delete(r))
    if (remaining.size) contextRoles.set(key, remaining)
    else contextRoles.delete(key)
  })
  .on('changed', (payload) => {
    const { store, key } = getRoleStore(payload)
    contextRoles.set(key, new Set([...store, ...payload.roles]))
  })

export default function useContextRoles<T extends string>(contentType: string) {
  function* iterRoles(
    pk: number,
    filter?: (roles: Set<T>) => boolean
  ): Generator<UserContextRoles, number> {
    const contextKey = getRoleKey(contentType, pk, '')
    let count = 0
    for (const [key, assigned] of contextRoles.entries()) {
      if (
        key.startsWith(contextKey) &&
        (!filter || filter(assigned as Set<T>))
      ) {
        const user = Number(key.split('/')[2])
        yield {
          user,
          assigned
        }
        count++
      }
    }
    return count
  }

  function getUserRoles(pk: number, userId?: number) {
    userId = userId ?? useAuthStore().user?.pk
    if (!userId) return
    const key = getRoleKey(contentType, pk, userId)
    return contextRoles.get(key)
  }

  function getRoleCount(pk: number, role: T) {
    const generator = iterRoles(pk, (roles) => roles.has(role))
    let res = generator.next()
    while (!res.done) res = generator.next()
    return res.value
  }

  // User ids that match any role
  function getRoleUserIds(pk: number, ...anyRoles: T[]) {
    return map(
      iterRoles(pk, (roles) => anyRoles.some((role) => roles.has(role))),
      (role) => role.user
    )
  }

  function set(pk: number, userId: number, roles: T[]) {
    // Sets or deletes roles
    const key = getRoleKey(contentType, pk, userId)
    if (roles.length) contextRoles.set(key, new Set(roles))
    else contextRoles.delete(key)
  }

  function hasRole(pk: number, roleName: T | T[], user?: number) {
    const userRoles = getUserRoles(pk, user)
    if (!userRoles) return
    if (typeof roleName === 'string') return userRoles.has(roleName)
    // Match any role of list
    return roleName.some((r) => userRoles.has(r))
  }

  function getAll<T extends string>(pk: number) {
    return [...iterRoles(pk)] as UserContextRoles<T>[]
  }

  /**
   * Get all user ids with roles in this context.
   */
  function getUserIds(pk: number) {
    return map(iterRoles(pk), (role) => role.user)
  }

  return {
    set,
    hasRole,
    getUserRoles,
    getAll,
    getRoleCount,
    getRoleUserIds,
    getUserIds
  }
}
