import { ref } from 'vue'

import { Organization } from '@/contentTypes/types'
import organization from '@/contentTypes/organization'

export const organizations = ref<Organization[] | null>(null)

const api = organization.getContentApi()

export default function useOrganizations () {
  async function fetchOrganizations () {
    const { data } = await api.list()
    organizations.value = data
  }

  return {
    fetchOrganizations
  }
}
