import { first } from 'itertools'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { IOrganisation } from './types'
import * as orgRules from './rules'
import { organisationType } from './contentTypes'

export default defineStore('organisations', () => {
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
   * Fetch organisation - error must be handled from calling function
   */
  async function fetchOrganisation() {
    const { data } = await organisationType.api.list()
    currentOrganisation.value = data.length ? data[0] : false
  }

  async function updateOrganisation(
    partial: Partial<Pick<IOrganisation, 'body' | 'help_info' | 'page_title'>>
  ) {
    if (!organisation.value) throw new Error('No organisation')
    const { data } = await organisationType.api.patch(
      organisation.value.pk,
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
