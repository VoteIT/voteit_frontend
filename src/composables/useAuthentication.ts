import { computed, readonly, ref } from 'vue'
import { AxiosError } from 'axios'

import { hasher } from '@/utils/stringToHSL'
import { IUser } from '@/modules/organisations/types'

import useContextRoles from './useContextRoles' // Import order important!
import { profileType } from '@/modules/organisations/contentTypes'

export const user = ref<IUser | null>(null)
export const userId = computed(() => user.value?.pk)

const alternateUsers = ref<IUser[]>([])
const isAuthenticated = ref<boolean | undefined>(undefined)
const organizationRoles = useContextRoles('organisation') // Avoid circular import

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Turn number into a pseudo random sort value, based on user pk
 */
export function getUserRandomSortValue(number: number) {
  const userPk = user.value?.pk ?? 1
  return [...`${number ** ((userPk % 16) + 2)}-voteit`].reduce(hasher, userPk)
}

export default function useAuthentication() {
  async function fetchAlternateUsers() {
    const { data } = await profileType.api.listAction<IUser[]>(
      'alternate',
      undefined,
      'get'
    )
    alternateUsers.value = data
  }

  function setAuthenticatedUser(_user: IUser) {
    user.value = _user
    isAuthenticated.value = true
    organizationRoles.set(
      _user.organisation,
      _user.pk,
      _user.organisation_roles
    )
    fetchAlternateUsers() // Do not await
  }

  async function fetchAuthenticatedUser(tries = 3): Promise<IUser | undefined> {
    try {
      const { data } = await profileType.api.list<IUser>()
      console.log('User authenticated', data.userid)
      setAuthenticatedUser(data)
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

  async function switchUser(user: { readonly pk: number }) {
    await profileType.api.action(user.pk, 'switch')
    // setAuthenticatedUser(user)
    location.reload()
  }

  async function logout() {
    if (!isAuthenticated.value) return
    console.log('Logging out')
    await profileType.api.listAction('logout')
    isAuthenticated.value = false
    user.value = null
    alternateUsers.value = []
  }

  async function updateProfile(profile: Pick<IUser, 'userid'>) {
    // Handle errors in calling function
    if (!user.value)
      throw new Error("Unauthenticated user can't update profile")
    const { data } = await profileType.api.patch(user.value.pk, profile)
    user.value = data
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
