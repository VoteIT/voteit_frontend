import { computed, reactive, readonly } from 'vue'

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

  // FIXME We will limit to one organisation per host for now. This is subject to change.
  const organisation = computed(() => {
    const first = organisations.values().next()
    return first.done ? null : first.value
  })

  return {
    organisations: readonly(organisations),
    organisation,
    fetchOrganisations
  }
}
