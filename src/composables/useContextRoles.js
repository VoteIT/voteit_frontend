import wu from 'wu'
import { ref } from 'vue'
import useAuthentication from './useAuthentication'

import useChannels from './useChannels'

const contextRoles = ref(new Map())

function getRoleKey (...components) {
  // Default context model = Meeting
  components[0] = components[0] || 'Meeting'
  return components.join('/')
}

useChannels()
  .registerUpdateHandler('roles', ({ t, p }) => {
    const key = getRoleKey(p.model, p.pk, p.user_pk)
    if (!contextRoles.value.has(key)) {
      contextRoles.value.set(key, new Set())
    }
    const roleStore = contextRoles.value.get(key)
    switch (t) {
      case 'roles.removed':
        p.roles.forEach(r => roleStore.delete(r))
        break
      case 'roles.added':
        p.roles.forEach(r => roleStore.add(r))
        break
    }
  })

export default function useContextRoles (model) {
  const { user } = useAuthentication()

  function getUserRoles (pk, userId) {
    const key = getRoleKey(model, pk, userId || user.value.pk)
    return contextRoles.value.get(key) || new Set()
  }

  function getRoleCount (pk, roleName) {
    const key = getRoleKey(model, pk, '')
    return [...wu(contextRoles.value.entries())
      .filter(([k, v]) => {
        // console.log(key, k, v, roleName)
        return k.startsWith(key) && v.has(roleName)
      })].length
  }

  function set (pk, userId, roles) {
    // Sets or replaces roles completely
    const key = getRoleKey(model, pk, userId)
    contextRoles.value.set(key, new Set(roles))
  }

  function add (pk, userId, roles) {
    const key = getRoleKey(model, pk, userId)
    const roleStore = contextRoles.value.get(key)
    if (roleStore) {
      roles.forEach(name => roleStore.add(name))
    } else {
      set(pk, userId, roles)
    }
  }

  function remove (pk, userId, roles) {
    const key = getRoleKey(model, pk, userId)
    const roleStore = contextRoles.value.get(key)
    if (roleStore) {
      roles.forEach(name => roleStore.delete(name))
    }
  }

  function hasRole (pk, roleName, userId) {
    const userRoles = getUserRoles(pk, userId)
    if (typeof roleName === 'string') {
      return userRoles.has(roleName)
    } else if (roleName && typeof roleName.some === 'function') {
      // Match any role of list
      return roleName.some(r => userRoles.value.has(r))
    } else if (roleName === undefined) {
      return true
    }
  }

  return {
    set,
    add,
    remove,
    hasRole,
    getUserRoles,
    getRoleCount
  }
}
