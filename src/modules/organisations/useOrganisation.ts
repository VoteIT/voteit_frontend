import { computed, ref } from 'vue'

import * as orgRules from './rules'

import { organisationType } from './contentTypes'
import type { Organisation } from './types'

/**
 * Current organisation
 * null = not fetched yet
 * false = No organisation on this domain
 */
const currentOrganisation = ref<Organisation | null | false>(null)
const organisation = computed(() => {
  if (!currentOrganisation.value) return
  return currentOrganisation.value
})

/**
 * Can users log in to this organisation?
 */
const canLogin = computed(() => organisation.value?.active)

/**
 * Fetch organisation - error must be handled from calling function
 */
async function fetchOrganisation() {
  const { data } = await organisationType.api.list()
  currentOrganisation.value = data.length ? data[0] : false
}

async function updateOrganisation(
  partial: Partial<Pick<Organisation, 'body' | 'help_info' | 'page_title'>>
) {
  if (!organisationId.value) throw new Error('No organisation')
  const { data } = await organisationType.api.patch(
    organisationId.value,
    partial
  )
  currentOrganisation.value = data
}

function buildIdServerURL(path: string) {
  if (!organisation.value?.id_host) return
  return `${organisation.value.id_host}${path}`
}

// URLs
const manageAccountURL = computed(() => buildIdServerURL('/'))
const proxyLogoutURL = computed(() => buildIdServerURL('/log-out'))
const idLoginURL = computed(() =>
  buildIdServerURL(`/login-to/${location.hostname}`)
)

const organisationId = computed(() => organisation.value?.pk)
const organisationIsUnavailable = computed(
  () => currentOrganisation.value === false
)

const organisationComponents = computed(() => {
  if (!organisation.value) return []
  return organisation.value.components.filter(
    (c) => c.is_valid && c.state === 'on'
  )
})

// Permissions
const canAddMeeting = computed(() => orgRules.canAddMeeting())
const isOrganisationManager = computed(() =>
  orgRules.isOrganisationManager(organisationId.value)
)
const canChangeOrganisation = computed(
  () => organisation.value && orgRules.canChangeOrganisation(organisation.value)
)

// Assumes singleton components
function getOrganisationComponent(name: string) {
  for (const component of organisationComponents.value) {
    if (component.component_name === name) return component
  }
}

export default function useOrganisation() {
  return {
    canAddMeeting,
    canChangeOrganisation,
    canLogin,
    idLoginURL,
    isOrganisationManager,
    organisation,
    organisationId,
    organisationIsUnavailable,
    manageAccountURL,
    proxyLogoutURL,
    fetchOrganisation,
    getOrganisationComponent,
    updateOrganisation
  }
}
