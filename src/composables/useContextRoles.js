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
    // TODO Check that we get userids
    if (!p.userids) {
      console.log('Roles changed, still no userids', p)
    } else {
      p.userids.forEach(userid => {
        const key = getRoleKey(p.model, p.pk, userid)
        if (!contextRoles.value.has(key)) {
          contextRoles.value.set(key, new Set())
        }
        const roleStore = contextRoles.value.get(key)
        switch (t) {
          case 'roles.removed':
            p.roles.forEach(roleStore.delete)
            break
          case 'roles.added':
            p.roles.forEach(roleStore.set)
            break
        }
      })
    }
  })

export default function useContextRoles (model) {
  const { user } = useAuthentication()

  function getUserRoles (pk, userId) {
    const key = getRoleKey(model, pk, userId || user.value.pk)
    return contextRoles.value.get(key) || new Set()
  }

  function setRoles (pk, userId, roles) {
    // From meeting, rest data
    const key = getRoleKey(model, pk, userId)
    contextRoles.value.set(key, new Set(roles))
  }

  return {
    setRoles,
    getUserRoles
  }
}
