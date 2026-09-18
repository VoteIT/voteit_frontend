import { computed, shallowRef } from 'vue'

import restApi from '@/utils/restApi'
import useOrgStore from '@/modules/organisations/useOrgStore'
import { LoginProvider } from '@/modules/organisations/types'

import useAuthStore from './useAuthStore'

/* eslint-disable camelcase */
/** One credential attached to the signed in account. */
export interface UserConnection {
  readonly pk: number
  readonly provider: string
  readonly title: string
  readonly created: string
  readonly modified: string
  /** Removing this one would leave the account with no way in. */
  readonly is_only_login_method: boolean
}
/* eslint-enable camelcase */

// Module level, not per component: the user menu, the profile page and the
// logout all read the same list, and it only changes when we change it.
const connections = shallowRef<UserConnection[] | null>(null)
let inFlight: Promise<UserConnection[]> | null = null

export default function useLoginMethods() {
  const authStore = useAuthStore()
  const orgStore = useOrgStore()

  async function fetchConnections(force = false) {
    if (connections.value && !force) return connections.value
    if (!inFlight || force) {
      inFlight = restApi
        .get<UserConnection[]>('user/connections/')
        .finally(() => {
          inFlight = null
        })
    }
    connections.value = await inFlight
    return connections.value
  }

  function getProvider(providerId: string) {
    return orgStore.providers.find((p) => p.provider_id === providerId)
  }

  /**
   * Which provider opened this session, as the server recorded it.
   *
   * Null for a session that came from no social backend of ours, and callers
   * then fall back to something that doesn't name a provider - guessing would
   * log someone out of a service they're still using.
   */
  const sessionProvider = computed<LoginProvider | undefined>(() => {
    const provider = authStore.user?.login_provider
    return provider ? getProvider(provider) : undefined
  })

  /** Where the user manages the account behind this session, if we can tell. */
  const manageAccountURL = computed(
    () => sessionProvider.value?.profile_url ?? undefined
  )
  /** Where to end the provider's own session, if we can tell. */
  const logoutURL = computed(
    () => sessionProvider.value?.logout_url ?? undefined
  )

  const connectedIds = computed(
    () => new Set((connections.value ?? []).map((c) => c.provider))
  )
  /** Login methods the organisation offers that this account doesn't have yet. */
  const connectableProviders = computed(() =>
    orgStore.providers.filter((p) => !connectedIds.value.has(p.provider_id))
  )

  /**
   * Start attaching another login method.
   *
   * The POST is what records the intent - without it the backend treats the
   * returning credential as someone else sitting down at an open session - so
   * the redirect has to wait for it.
   */
  async function connect(provider: LoginProvider) {
    const { login_url: loginUrl } = await restApi.post<{ login_url: string }>(
      'user/connect/',
      { provider: provider.provider_id }
    )
    location.assign(loginUrl)
  }

  async function disconnect(connection: UserConnection) {
    await restApi.post('user/disconnect/', { provider: connection.provider })
    await fetchConnections(true)
  }

  return {
    connectableProviders,
    connections: computed(() => connections.value),
    logoutURL,
    manageAccountURL,
    sessionProvider,
    connect,
    disconnect,
    fetchConnections
  }
}

/** Forget what the last session's connections were. See `sessionEnd`. */
export function clearLoginMethods() {
  connections.value = null
}
