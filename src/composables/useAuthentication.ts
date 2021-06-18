import { ref } from 'vue'

import { User } from '@/utils/types'
import restApi from '@/utils/restApi'

import devLoginType from '@/contentTypes/devLogin'
import { Organization } from '@/contentTypes/types'
import useContextRoles from './useContextRoles'

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const organizationRoles = useContextRoles('organisation') // Avoid circular import

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function useAuthentication () {
  const contentApi = devLoginType.getContentApi()

  async function fetchAuthenticatedUser (tries = 3): Promise<User | null> {
    try {
      const { data } = await restApi.get<User>('user/')
      console.log('User authenticated', data.username)
      user.value = data
      isAuthenticated.value = true
      organizationRoles.set(data.organisation, data.pk, data.organisation_roles)
      return data
    } catch (err) {
      switch (err.response?.status) {
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

  function startOrganizationLogin (organization: Organization) {
    if (!organization.login_url) throw new Error(`Organization ${organization.title} has no login information`)
    location.assign(organization.login_url)
  }

  // async function authenticate (usr: DevUser) {
  //   console.log('Authenticating', usr.username)
  //   return contentApi.retrieve(usr.username)
  //     .then(({ data }: { data: any }) => {
  //       // user.value = usr
  //       sessionStorage.user = JSON.stringify(usr)
  //       isAuthenticated.value = true
  //     })
  //     .catch(() => {
  //       delete sessionStorage.user
  //     })
  // }

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
    fetchAuthenticatedUser,
    startOrganizationLogin,
    logout
  }
}
