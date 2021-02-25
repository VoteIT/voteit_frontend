import { ref } from 'vue'

import devLoginType from '@/contentTypes/devLogin'

import { DevUser } from '@/utils/types'
import { setAuthToken } from '@/utils/restApi'

const user = ref(sessionStorage.user ? JSON.parse(sessionStorage.user) : null)
const isAuthenticated = ref(false)
const authToken = ref<string | null>(null)

export default function useAuthentication () {
  const contentApi = devLoginType.useContentApi()

  async function authenticate (usr: DevUser) {
    console.log('Authenticating', usr.username)
    return contentApi.retrieve(usr.username)
      .then(({ data }: { data: any }) => {
        user.value = usr
        sessionStorage.user = JSON.stringify(usr)
        setAuthToken(data.key)
        isAuthenticated.value = true
        authToken.value = data.key
      })
      .catch(() => {
        delete sessionStorage.user
      })
  }

  function logout () {
    console.log('Logging out')
    delete sessionStorage.user
    setAuthToken()
    isAuthenticated.value = false
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    authToken,
    authenticate,
    logout
  }
}
