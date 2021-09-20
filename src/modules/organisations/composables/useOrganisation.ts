import { computed } from 'vue'

import useAuthentication from '@/composables/useAuthentication'

import useOrganisations from './useOrganisations'

const { organisations } = useOrganisations()
const { user } = useAuthentication()

export default function useOrganisation () {
  const organisation = computed(() => user.value && organisations.get(user.value.organisation))
  return {
    organisation
  }
}
