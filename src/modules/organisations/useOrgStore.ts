import { isAxiosError } from 'axios'
import { first } from 'itertools'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import restApi from '@/utils/restApi'
import { IOrganisation } from './types'
import * as orgRules from './rules'

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

  /**
   * Fetch organisation - error other than 404 must be handled from calling function
   */
  async function fetchOrganisation() {
    try {
      const { data } = await restApi.get<IOrganisation>('organisation/')
      currentOrganisation.value = data
    } catch (e) {
      if (!isAxiosError(e) || e.response?.status !== 404) throw e
      currentOrganisation.value = false // Unavailable
    }
  }

  async function updateOrganisation(
    partial: Partial<Pick<IOrganisation, 'body' | 'help_info' | 'page_title'>>
  ) {
    const { data } = await restApi.patch<IOrganisation>(
      'organisation/change/',
      partial
    )
    currentOrganisation.value = data
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
    updateOrganisation
  }
})
