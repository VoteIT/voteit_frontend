import { reactive } from 'vue'

import Channel from '@/contentTypes/Channel'
import { SuccessMessage } from '@/utils/types'

import useAuthentication from './useAuthentication'
import { ContextRoles, UserContextRoles } from './types'

const contextRoles = reactive<Map<string, Set<string>>>(new Map())

type keyComponent = string | number
function getRoleKey (...components: keyComponent[]) {
  // Default context model = Meeting
  components[0] = components[0] || 'Meeting'
  return components.join('/')
}

function getRoleStore (p: ContextRoles): { key: string, store: Set<string> } {
  const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
  if (!contextRoles.has(key)) contextRoles.set(key, new Set())
  return {
    key,
    store: contextRoles.get(key) as Set<string>
  }
}

new Channel('roles')
  .on<ContextRoles>('removed', payload => {
    const { store, key } = getRoleStore(payload)
    payload.roles.forEach(r => store.delete(r))
    if (!store.size) contextRoles.delete(key)
  })
  .on<ContextRoles>('added', payload => {
    const { store } = getRoleStore(payload)
    payload.roles.forEach(r => store.add(r))
  })

export default function useContextRoles (contentType: string) {
  const { user } = useAuthentication()

  function getUserRoles (pk: number, userId?: number) {
    userId = userId ?? user.value?.pk
    if (userId) {
      const key = getRoleKey(contentType, pk, userId)
      return contextRoles.get(key) || new Set()
    }
  }

  function getRoleCount (pk: number, roleName: string) {
    const key = getRoleKey(contentType, pk, '')
    let count = 0
    for (const [k, v] of contextRoles.entries()) {
      if (k.startsWith(key) && v.has(roleName)) { count++ }
    }
    return count
  }

  function set (pk: number, userId: number, roles: string[]) {
    // Sets or deletes roles
    const key = getRoleKey(contentType, pk, userId)
    if (roles.length) contextRoles.set(key, new Set(roles))
    else contextRoles.delete(key)
  }

  function hasRole (pk: number, roleName: string | string[], user?: number): boolean {
    const userRoles = getUserRoles(pk, user)
    if (userRoles) {
      if (typeof roleName === 'string') {
        return userRoles.has(roleName)
      } else if (roleName && typeof roleName.some === 'function') {
        // Match any role of list
        return roleName.some(r => userRoles.has(r))
      }
    }
    return false
  }

  function * iterAll (pk: number): Generator<UserContextRoles> {
    const contextKey = getRoleKey(contentType, pk) + '/'
    for (const [key, assigned] of contextRoles.entries()) {
      if (key.startsWith(contextKey)) {
        const user = Number(key.split('/')[2])
        yield {
          user,
          assigned
        }
      }
    }
  }

  function getAll<T extends string> (pk: number) {
    return [...iterAll(pk)] as UserContextRoles<T>[]
  }

  function getUserIds (pk: number): number[] {
    return [...iterAll(pk)].map(v => v.user)
  }

  return {
    set,
    hasRole,
    getUserRoles,
    getAll,
    getRoleCount,
    getUserIds
  }
}
