import { first } from 'itertools'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import restApi, { isApiError } from '@/utils/restApi'
import { IOrganisation } from './types'
import * as orgRules from './rules'

/**
 * How long a fetched organisation counts as current. Long enough that the boot
 * fetch and the home view landing on its heels don't ask twice, short enough
 * that coming back to the start page shows what someone else has since edited.
 */
const FRESH_FOR = 30_000

export default defineStore('organisation', () => {
  /**
   * Current organisation
   * undefined = not fetched yet
   * false = No organisation on this domain
   */
  const currentOrganisation = shallowRef<IOrganisation | false>()
  const organisation = computed(() => currentOrganisation.value || undefined)

  const organisationIsUnavailable = computed(
    () => currentOrganisation.value === false
  )

  /**
   * Can users log in to this organisation?
   */
  const canLogin = computed(() => !!organisation.value?.active)

  // URLs
  function buildIdServerURL(path: string) {
    if (!organisation.value?.id_host) return
    return `${organisation.value.id_host}${path}`
  }

  const manageAccountURL = computed(() => buildIdServerURL('/'))
  const proxyLogoutURL = computed(() => buildIdServerURL('/log-out'))
  const loginURL = computed(() => {
    if (!organisation.value) return
    const params =
      location.pathname === '/'
        ? ''
        : `?next=${encodeURIComponent(location.pathname)}`
    return organisation.value.login_url + params
  })

  // Permissions
  const canAddMeeting = computed(() => orgRules.canAddMeeting())
  const isOrganisationManager = computed(() =>
    orgRules.isOrganisationManager(organisation.value?.pk)
  )
  const canChangeOrganisation = computed(
    () =>
      organisation.value && orgRules.canChangeOrganisation(organisation.value)
  )

  /** When the organisation last came from the server, for `refreshOrganisation`. */
  let fetchedAt = 0

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
    // Not reached when the error was rethrown: nothing was fetched then
    fetchedAt = Date.now()
  }

  /**
   * Bring the organisation up to date, unless it already is.
   *
   * For a view that wants current content every time it's opened. The boot
   * fetches the organisation before the first route is loaded, so without the
   * check the home view would ask again the moment it mounted - and again on
   * every trip back to it. A domain with no organisation counts as fetched
   * too, so there's nothing to be gained by asking it more often.
   */
  async function refreshOrganisation() {
    if (
      currentOrganisation.value !== undefined &&
      Date.now() - fetchedAt < FRESH_FOR
    )
      return
    await fetchOrganisation()
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
    loginURL,
    manageAccountURL,
    organisation,
    organisationIsUnavailable,
    proxyLogoutURL,
    fetchOrganisation,
    getOrganisationComponent,
    refreshOrganisation,
    updateOrganisation
  }
})
