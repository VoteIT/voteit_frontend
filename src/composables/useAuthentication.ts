import { ref } from 'vue'

import useRestApi from './useRestApi'

import { DevUser } from '@/utils/types'

const user = ref(sessionStorage.user ? JSON.parse(sessionStorage.user) : null)
const isAuthenticated = ref(false)
const authToken = ref(null)

export default function useAuthentication () {
  const restApi = useRestApi()

  async function authenticate (usr: DevUser) {
    console.log('Authenticating', usr.username)
    return restApi.get(`dev-login/${usr.username}/`)
      .then(({ data }) => {
        user.value = usr
        sessionStorage.user = JSON.stringify(usr)
        restApi.setAuthToken(data.key)
        isAuthenticated.value = true
        authToken.value = data.key
      })
      .catch(_ => {
        delete sessionStorage.user
      })
  }

  function logout () {
    console.log('Logging out')
    delete sessionStorage.user
    restApi.setAuthToken()
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
