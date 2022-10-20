import { computed } from 'vue'

import { canAddMeeting, canChangeOrganisation } from './rules'
import useOrganisations from './useOrganisations'

const { organisation } = useOrganisations()

export default function useOrganisation () {
  const manageAccountURL = computed(() => {
    if (!organisation.value) return
    return `${organisation.value.id_host}/`
  })
  const proxyLogoutURL = computed(() => {
    if (!organisation.value) return
    return `${organisation.value.id_host}/log-out`
  })
  const idLoginURL = computed(() => {
    if (!organisation.value || !organisation.value.id_host) return
    return `${organisation.value.id_host}/login-to/${location.hostname}`
  })

  const organisationComponents = computed(() => {
    if (!organisation.value) return []
    return organisation.value.components.filter(
      c => c.is_valid && c.state === 'on'
    )
  })

  // Assumes singleton components
  function getOrganisationComponent (name: string) {
    for (const component of organisationComponents.value) {
      if (component.component_name === name) return component
    }
  }

  return {
    canAddMeeting: computed(() => canAddMeeting()),
    canChangeOrganisation: computed(() => !!organisation.value && canChangeOrganisation(organisation.value)),
    idLoginURL,
    organisation,
    organisationId: computed(() => organisation.value?.pk),
    manageAccountURL,
    proxyLogoutURL,
    getOrganisationComponent
  }
}
