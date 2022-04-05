import { readonly, ref } from 'vue'
import { AxiosError } from 'axios'

import useContextRoles from './useContextRoles'
import { UserState, User } from '@/modules/organisations/types'
import { profileType } from '@/modules/organisations/contentTypes'

interface AlternateUser {
  pk: number
  name: string
}

export const user = ref<User | null>(null)
const alternateUsers = ref<AlternateUser[]>([])
const isAuthenticated = ref<boolean | undefined>(undefined)
const organizationRoles = useContextRoles('organisation') // Avoid circular import

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function useAuthentication () {
  async function fetchAlternateUsers () {
    const { data } = await profileType.api.getAction<AlternateUser[]>('alternate')
    alternateUsers.value = data
  }

  async function fetchAuthenticatedUser (tries = 3): Promise<User | undefined> {
    try {
      const { data } = await profileType.api.list<User>()
      console.log('User authenticated', data.userid)
      // TODO
      if (data.state === UserState.Incomplete) console.warn('User is incomplete')
      user.value = data
      isAuthenticated.value = true
      organizationRoles.set(data.organisation, data.pk, data.organisation_roles)
      fetchAlternateUsers() // Do not await
      return data
    } catch (err) {
      switch ((err as AxiosError).response?.status) {
        case 401:
          isAuthenticated.value = false
          console.log('Not logged in')
          return
        default:
          if (tries === 0) throw new Error('Unknown authentication error')
          await sleep(1000)
          return fetchAuthenticatedUser(tries - 1)
      }
    }
  }

  async function switchUser (user: AlternateUser) {
    await profileType.api.action(user.pk, 'switch')
    await fetchAuthenticatedUser()
  }

  async function logout () {
    if (!isAuthenticated.value) return
    console.log('Logging out')
    try {
      await profileType.api.action('logout')
      isAuthenticated.value = false
      user.value = null
      alternateUsers.value = []
    } catch {
      // TODO
    }
  }

  async function updateProfile (profile: Pick<User, 'userid'>) {
    if (!user.value) throw new Error('Unauthenticated user can\'t update profile')
    try {
      const { data } = await profileType.api.patch(user.value.pk, profile)
      user.value = { ...user.value, ...data }
    } catch {
      // TODO
    }
  }

  return {
    alternateUsers: readonly(alternateUsers),
    user,
    isAuthenticated,
    fetchAuthenticatedUser,
    logout,
    switchUser,
    updateProfile
  }
}
