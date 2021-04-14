import { ref } from 'vue'

import { DevUser, User } from '@/utils/types'
import restApi, { setAuthToken } from '@/utils/restApi'

import devLoginType from '@/contentTypes/devLogin'
import { Organization } from '@/contentTypes/types'

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const authToken = ref<string | null>(null) // TODO Remove

export default function useAuthentication () {
  const contentApi = devLoginType.getContentApi()

  async function fetchAuthenticatedUser (tries = 3): Promise<User | null> {
    try {
      const { data }: { data: User } = await restApi.get('user/')
      console.log('User authenticated', data.username)
      user.value = data
      isAuthenticated.value = true
      return data
    } catch (err) {
      switch (err.response?.status) {
        case 401:
          console.log('Not logged in')
          return null
        default:
          if (tries === 0) throw new Error('Unknown authentication error')
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchAuthenticatedUser(tries - 1)
      }
    }
  }

  function startOrganizationLogin (organization: Organization) {
    if (!organization.login_url) throw new Error(`Organization ${organization.title} has no login information`)
    location.assign(organization.login_url)
  }

  async function authenticate (usr: DevUser) {
    console.log('Authenticating', usr.username)
    return contentApi.retrieve(usr.username)
      .then(({ data }: { data: any }) => {
        // user.value = usr
        sessionStorage.user = JSON.stringify(usr)
        setAuthToken(data.key)
        isAuthenticated.value = true
        authToken.value = data.key
      })
      .catch(() => {
        delete sessionStorage.user
      })
  }

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
    authToken,
    authenticate,
    fetchAuthenticatedUser,
    startOrganizationLogin,
    logout
  }
}
