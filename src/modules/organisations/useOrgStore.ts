import { first } from 'itertools'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import restApi, { isApiError } from '@/utils/restApi'
import { IOrganisation, LoginProvider } from './types'
import * as orgRules from './rules'
import { organisationType } from './contentTypes'

export default defineStore('organisation', () => {
  /**
   * Current organisation
   * undefined = not fetched yet
   * false = No organisation on this domain
   */
  const currentOrganisation = shallowRef<IOrganisation | false>()
  const organisation = computed(() => currentOrganisation.value || undefined)

  /**
   * Organisation channel is automatically subscribed when establishing socket connection.
   */
  organisationType.onChanged((org) => {
    currentOrganisation.value = org
  })

  const organisationIsUnavailable = computed(
    () => currentOrganisation.value === false
  )

  /**
   * Can users log in to this organisation?
   */
  const canLogin = computed(() => !!organisation.value?.active)

  // Login providers
  /** Ordered by the backend: the primary first, then the rest by title. */
  const providers = computed(() => organisation.value?.providers ?? [])
  const primaryProvider = computed<LoginProvider | undefined>(
    () => providers.value[0]
  )
  /**
   * Everything the organisation's providers vouch for, which is what decides
   * which invite data types are in play.
   */
  const scopes = computed(() => [
    ...new Set(providers.value.flatMap((p) => p.scope))
  ])

  // URLs
  /**
   * Where to send a user to sign in, coming back to `next` afterwards.
   *
   * Takes the path rather than reading it, so a guard turning someone away
   * from a route can name the page they were heading for - by then the
   * browser is still on the one they're leaving.
   */
  function getLoginURL(provider: LoginProvider, next = location.pathname) {
    const params = next === '/' ? '' : `?next=${encodeURIComponent(next)}`
    return provider.login_url + params
  }

  function startLogin(provider: LoginProvider, next?: string) {
    location.assign(getLoginURL(provider, next))
  }

  // Permissions
  const canAddMeeting = computed(() => orgRules.canAddMeeting())
  const isOrganisationManager = computed(() =>
    orgRules.isOrganisationManager(organisation.value?.pk)
  )
  const canChangeOrganisation = computed(
    () =>
      organisation.value && orgRules.canChangeOrganisation(organisation.value)
  )

  /**
   * Fetch organisation - error other than 404 must be handled from calling function
   */
  async function fetchOrganisation() {
    try {
      currentOrganisation.value =
        await restApi.get<IOrganisation>('organisation/')
    } catch (e) {
      if (!isApiError(e) || e.status !== 404) throw e
      currentOrganisation.value = false // Unavailable
    }
  }

  async function updateOrganisation(
    partial: Partial<Pick<IOrganisation, 'body' | 'help_info' | 'page_title'>>
  ) {
    currentOrganisation.value = await restApi.patch<IOrganisation>(
      'organisation/change/',
      partial
    )
  }

  // Assumes singleton components
  function getOrganisationComponent(name: string) {
    return first(
      organisation.value?.components ?? [],
      (c) => c.component_name === name && c.is_valid && c.state === 'on'
    )
  }

  return {
    canAddMeeting,
    canChangeOrganisation,
    canLogin,
    isOrganisationManager,
    organisation,
    organisationIsUnavailable,
    primaryProvider,
    providers,
    scopes,
    fetchOrganisation,
    getLoginURL,
    getOrganisationComponent,
    startLogin,
    updateOrganisation
  }
})
