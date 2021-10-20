import { ref } from 'vue'

import restApi from '@/utils/restApi'

import useContextRoles from './useContextRoles'
import { UserState, User, Organisation } from '@/modules/organisations/types'
import { AxiosError } from 'axios'

export const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const organizationRoles = useContextRoles('organisation') // Avoid circular import

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function useAuthentication () {
  async function fetchAuthenticatedUser (tries = 3): Promise<User | null> {
    try {
      const { data } = await restApi.get<User>('user/')
      console.log('User authenticated', data.userid)
      // TODO
      if (data.state === UserState.Incomplete) console.warn('User is incomplete')
      user.value = data
      isAuthenticated.value = true
      organizationRoles.set(data.organisation, data.pk, data.organisation_roles)
      return data
    } catch (err) {
      switch ((err as AxiosError).response?.status) {
        case 401:
          console.log('Not logged in')
          return null
        default:
          if (tries === 0) throw new Error('Unknown authentication error')
          await sleep(1000)
          return fetchAuthenticatedUser(tries - 1)
      }
    }
  }

  // function startOrganizationLogin (organization: Organization) {
  //   if (!organization.login_url) throw new Error(`Organization ${organization.title} has no login information`)
  //   location.assign(organization.login_url)
  // }

  function getOrganizationLoginURL (organization: Organisation): string {
    if (!organization.login_url) throw new Error(`Organization ${organization.title} has no login information`)
    return `${process.env.VUE_APP_ID_HOST}/login-to/${organization.pk}` // TODO Add /login or whatenvs
  }

  const manageAccountURL = process.env.VUE_APP_ID_HOST as string

  async function logout () {
    if (!isAuthenticated.value) return
    console.log('Logging out')
    await restApi.post('user/logout/')
    isAuthenticated.value = false
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    manageAccountURL,
    fetchAuthenticatedUser,
    // startOrganizationLogin,
    getOrganizationLoginURL,
    logout
  }
}
