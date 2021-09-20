import { reactive, readonly } from 'vue'

import { Organization } from '@/contentTypes/types'
import organisationType from '@/contentTypes/organization'

const organisations = reactive<Map<number, Organization>>(new Map())

const api = organisationType.getContentApi()

export default function useOrganisations () {
  // TODO Error handle
  async function fetchOrganisations () {
    const { data } = await api.list()
    data.forEach(org => {
      organisations.set(org.pk, org)
    })
  }

  return {
    organisations: readonly(organisations),
    fetchOrganisations
  }
}
