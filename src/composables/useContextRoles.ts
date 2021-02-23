import { SuccessMessage } from '@/utils/types'
import { reactive } from 'vue'
import { ContextRoles } from './types'
import useAuthentication from './useAuthentication'
import useChannels from './useChannels'

const contextRoles = reactive<Map<string, Set<string>>>(new Map())

type keyComponent = string | number
function getRoleKey (...components: keyComponent[]) {
  // Default context model = Meeting
  components[0] = components[0] || 'Meeting'
  return components.join('/')
}

useChannels('roles')
  .onUpdate((message: SuccessMessage) => {
    const t = message.t
    const p = message.p as ContextRoles
    const key = getRoleKey(p.model, p.pk, p.user_pk)
    if (!contextRoles.has(key)) contextRoles.set(key, new Set())
    const roleStore = contextRoles.get(key) as Set<string>
    switch (t) {
      case 'roles.removed':
        p.roles.forEach(r => roleStore.delete(r))
        break
      case 'roles.added':
        p.roles.forEach(r => roleStore.add(r))
        break
    }
  })

export default function useContextRoles (model: string) {
  const { user } = useAuthentication()

  function getUserRoles (pk: number, userId?: number) {
    const key = getRoleKey(model, pk, userId || user.value.pk)
    return contextRoles.get(key) || new Set()
  }

  function getRoleCount (pk: number, roleName: string) {
    const key = getRoleKey(model, pk, '')
    let count = 0
    for (const [k, v] of contextRoles.entries()) {
      if (k.startsWith(key) && v.has(roleName)) { count++ }
    }
    return count
  }

  function set (pk: number, userId: number, roles: string[]) {
    // Sets or replaces roles completely
    const key = getRoleKey(model, pk, userId)
    contextRoles.set(key, new Set(roles))
  }

  function hasRole (pk: number, roleName: string | string[], userId?: number) {
    const userRoles = getUserRoles(pk, userId)
    if (typeof roleName === 'string') {
      return userRoles.has(roleName)
    } else if (roleName && typeof roleName.some === 'function') {
      // Match any role of list
      return roleName.some(r => userRoles.has(r))
    } else if (roleName === undefined) {
      return true
    }
  }

  function getAll (pk: number) {
    const contextKey = getRoleKey(model, pk) + '/'
    const results = []
    for (const [key, assigned] of contextRoles.entries()) {
      if (key.startsWith(contextKey)) {
        const userPk = Number(key.split('/')[2])
        results.push({
          userPk,
          assigned
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
