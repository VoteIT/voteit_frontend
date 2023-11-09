import { map } from 'itertools'
import { defer } from 'lodash'
import { reactive } from 'vue'

import { user } from './useAuthentication'
import { ContextRoles, UserContextRoles } from './types'
import ContentType from '@/contentTypes/ContentType'

const contextRoles = reactive<Map<string, Set<string>>>(new Map())

function getRoleKey(...components: [string, number, number | '']) {
  return components.join('/')
}

function hasRoleKey(p: ContextRoles): boolean {
  const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
  return contextRoles.has(key)
}

function getRoleStore(p: ContextRoles): { key: string; store: Set<string> } {
  const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
  if (!contextRoles.has(key)) contextRoles.set(key, new Set())
  return {
    key,
    store: contextRoles.get(key) as Set<string>
  }
}

new ContentType<ContextRoles>({ name: 'roles' })
  .on('removed', (payload) => {
    if (!hasRoleKey(payload)) return
    const { store, key } = getRoleStore(payload)
    payload.roles.forEach((r) => store.delete(r))
    // Defer to trigger reactivity on empty role list, before removing role store completely
    if (!store.size) defer(() => contextRoles.delete(key))
  })
  .on('added', (payload) => {
    const { store } = getRoleStore(payload)
    payload.roles.forEach((r) => store.add(r))
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
    userId = userId ?? user.value?.pk
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

  function hasRole(
    pk: number,
    roleName: T | T[],
    user?: number
  ): undefined | boolean {
    const userRoles = getUserRoles(pk, user)
    if (!userRoles) return
    if (userRoles) {
      if (typeof roleName === 'string') {
        return userRoles.has(roleName)
      } else if (roleName && typeof roleName.some === 'function') {
        // Match any role of list
        return roleName.some((r) => userRoles.has(r))
      }
    }
    return false
  }

  function getAll<T extends string>(pk: number) {
    return [...iterRoles(pk)] as UserContextRoles<T>[]
  }

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
