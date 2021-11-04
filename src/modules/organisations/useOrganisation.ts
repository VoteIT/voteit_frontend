import { computed } from 'vue'

import useOrganisations from './useOrganisations'

const { organisation } = useOrganisations()

export default function useOrganisation () {
  const manageAccountURL = computed(() => {
    if (!organisation.value) return
    return `${organisation.value.id_host}/`
  })
  const idLoginURL = computed(() => {
    if (!organisation.value || !organisation.value.id_host) return
    return `${organisation.value.id_host}/login-to/${organisation.value.pk}`
  })

  return {
    organisation,
    manageAccountURL,
    idLoginURL
  }
}
