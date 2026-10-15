import { computed, shallowRef, watchEffect } from 'vue'

import type { RequirementFactory } from '@/loader/types'
import restApi, { isApiError } from '@/utils/restApi'
import useOrgStore from './useOrgStore'

export interface ContactInfo {
  text: string
  generic_email: string
  invoice_email: string
  invoice_info: string
  modified: string // ISO date
  organisation: number
  pk: number
  requires_check: boolean
}

/** Undefined until fetched */
const contactInfo = shallowRef<ContactInfo>()
const requiresCheck = computed(() => contactInfo.value?.requires_check)
/**
 * Outcome of the last fetch: 'inaccessible' on a 404 (the organisation has no
 * contact info for us), 'failed' on any other error, 'idle' before and after
 * a successful one.
 */
const status = shallowRef<'idle' | 'inaccessible' | 'loading' | 'failed'>(
  'idle'
)

/**
 * Fetches until contact info is in, then never again. Never throws - the
 * outcome is in status, and contact info stays undefined until a fetch succeeds.
 */
async function fetchContactInfo() {
  if (contactInfo.value) return
  status.value = 'loading'
  try {
    contactInfo.value = await restApi.get<ContactInfo>('contact-info/')
    status.value = 'idle'
  } catch (e) {
    if (isApiError(e) && e.status === 404) status.value = 'inaccessible'
    else status.value = 'failed'
  }
}

async function saveContactInfo(info: Partial<ContactInfo>) {
  const data = await restApi.patch<ContactInfo>('contact-info/change/', info)
  contactInfo.value = data
  return data
}

/**
 * The panel is hidden when the fetch answers 404, so a link straight to it
 * waits for the answer - or it would show, then be sent to the overview. Any
 * other failure opens the panel, which offers to try again.
 */
export const contactInfoPanelRequirement: RequirementFactory = (to) => {
  if (to.params.panel !== 'contactInfo') return
  return {
    key: 'contact-info',
    blocking: true,
    async load() {
      if (useOrgStore().canChangeOrganisation) await fetchContactInfo()
    }
  }
}

/**
 * @param quietCheck If true, contact info will be fetched if and when user has permission to change organisation. Errors end up in status.
 * @returns
 */
export default function useContactInfo(quietCheck = false) {
  const orgStore = useOrgStore()

  // Fetched once the user may change the organisation, for the toolbar's attention count and panel list
  if (quietCheck)
    watchEffect(() => {
      if (orgStore.canChangeOrganisation) fetchContactInfo()
    })

  return {
    contactInfo,
    status,
    requiresCheck,
    fetchContactInfo,
    saveContactInfo
  }
}
