import { computed, ref, watchEffect } from 'vue'
import restApi from '@/utils/restApi'
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

const contactInfo = ref<ContactInfo | null>(null)
const requiresCheck = computed(() => contactInfo.value?.requires_check)

async function fetchContactInfo() {
  const { data } = await restApi.get<ContactInfo>('contact-info/')
  contactInfo.value = data
  return data
}

async function saveContactInfo(info: ContactInfo) {
  const { data } = await restApi.patch<ContactInfo>(
    'contact-info/change/',
    info
  )
  contactInfo.value = data
  return data
}

/**
 * @param quietCheck If true, contact info will be fetched if and when user has permission to change organisation. Errors are suppressed.
 * @returns
 */
export default function useContactInfo(quietCheck = false) {
  const orgStore = useOrgStore()

  // Trigger when socket is open, user is manager and quietCheck is set
  if (quietCheck)
    watchEffect(() => {
      if (orgStore.canChangeOrganisation) fetchContactInfo().catch()
    })

  return {
    contactInfo,
    requiresCheck,
    fetchContactInfo,
    saveContactInfo
  }
}
