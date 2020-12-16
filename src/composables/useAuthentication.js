import { ref } from 'vue'
import useRestApi from './useRestApi.js'

const user = ref(sessionStorage.user ? JSON.parse(sessionStorage.user) : null)
const isAuthenticated = ref(false)
const authToken = ref(null)

export default function useAuthentication () {
  const { restApi, setAuthToken } = useRestApi()

  async function authenticate (_user) {
    console.log('Authenticating', _user.username)
    return restApi.get(`dev-login/${_user.username}/`)
      .then(({ data }) => {
        user.value = _user
        sessionStorage.user = JSON.stringify(_user)
        setAuthToken(data.key)
        isAuthenticated.value = true
        authToken.value = data.key
      })
      .catch(_ => {
        // TODO: Maybe no
        logout()
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
