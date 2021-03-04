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

new Channel<ContextRoles>('roles')
  .onUpdate((message: SuccessMessage) => {
    if (['roles.removed', 'roles.added'].includes(message.t)) {
      const p = message.p as ContextRoles
      const key = getRoleKey(p.model.toLowerCase(), p.pk, p.user_pk)
      if (!contextRoles.has(key)) contextRoles.set(key, new Set())
      const roleStore = contextRoles.get(key) as Set<string>
      switch (message.t) {
        case 'roles.removed':
          p.roles.forEach(r => roleStore.delete(r))
          break
        case 'roles.added':
          p.roles.forEach(r => roleStore.add(r))
          break
      }
    }
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
    // Sets or replaces roles completely
    const key = getRoleKey(contentType, pk, userId)
    contextRoles.set(key, new Set(roles))
  }

  function hasRole (pk: number, roleName: string | string[], user?: number) {
    const userRoles = getUserRoles(pk, user)
    if (typeof roleName === 'string') {
      return userRoles?.has(roleName)
    } else if (roleName && typeof roleName.some === 'function') {
      // Match any role of list
      return roleName.some(r => userRoles?.has(r))
    } else if (roleName === undefined) {
      return true
    }
  }

  function getAll<T> (pk: number): UserContextRoles<T>[] {
    const contextKey = getRoleKey(contentType, pk) + '/'
    const results: UserContextRoles<T>[] = []
    for (const [key, assigned] of contextRoles.entries()) {
      if (key.startsWith(contextKey)) {
        const user = Number(key.split('/')[2])
        results.push({
          user,
          assigned: assigned as any as Set<T>
        })
      }
    }
    return results
  }

  return {
    set,
    hasRole,
    getUserRoles,
    getAll,
    getRoleCount
  }
}
