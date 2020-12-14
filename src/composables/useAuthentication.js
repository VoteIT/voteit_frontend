import { ref } from 'vue'
import useRestApi from './useRestApi.js'

const user = ref(sessionStorage.user ? JSON.parse(sessionStorage.user) : null)
const isAuthenticated = ref(false)
const authToken = ref(null)

export default function useAuthentication () {
  const { restApi, setAuthToken } = useRestApi()

  async function authenticate (username) {
    restApi.get(`dev-login/${username}/`)
      .then(({ data }) => {
        user.value = { username }
        sessionStorage.user = JSON.stringify({ username })
        setAuthToken(data.key)
        isAuthenticated.value = true
        authToken.value = data.key
      })
      .catch(_ => {
        logout()
      })
  }

  function logout () {
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
