import { reactive, readonly } from 'vue'

import { organisationType } from './contentTypes'
import { Organisation } from './types'

const organisations = reactive<Map<number, Organisation>>(new Map())

export default function useOrganisations () {
  // TODO Error handle
  async function fetchOrganisations () {
    const { data } = await organisationType.api.list()
    data.forEach(org => {
      organisations.set(org.pk, org)
    })
  }

  return {
    organisations: readonly(organisations),
    fetchOrganisations
  }
}
