import { computed } from 'vue'

import { canAddMeeting, canChangeOrganisation } from './rules'
import useOrganisations from './useOrganisations'

const { organisation } = useOrganisations()

export default function useOrganisation () {
  const manageAccountURL = computed(() => {
    if (!organisation.value) return
    return `${organisation.value.id_host}/`
  })
  const idLoginURL = computed(() => {
    if (!organisation.value || !organisation.value.id_host) return
    return `${organisation.value.id_host}/login-to/${location.hostname}`
  })

  return {
    canAddMeeting: computed(() => canAddMeeting()),
    canChangeOrganisation: computed(() => !!organisation.value && canChangeOrganisation(organisation.value)),
    organisation,
    organisationId: computed(() => organisation.value?.pk),
    manageAccountURL,
    idLoginURL
  }
}
