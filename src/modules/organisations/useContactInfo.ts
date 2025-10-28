import { SocketState, socket, socketState } from '@/utils/Socket'
import { computed, ref, watch } from 'vue'
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
  const { p } = await socket.call<ContactInfo>('contact_info.get')
  contactInfo.value = p
  return p
}

async function saveContactInfo(data: ContactInfo) {
  const { p } = await socket.call<ContactInfo>('contact_info.set', data)
  contactInfo.value = p
  return p
}

/**
 * @param quietCheck If true, contact info will be fetched if and when user has permission to change organisation. Errors are suppressed.
 * @returns
 */
export default function useContactInfo(quietCheck = false) {
  // Trigger when socket is open, user is manager and quietCheck is set
  const orgStore = useOrgStore()

  watch(
    () =>
      orgStore.canChangeOrganisation &&
      socketState.value === SocketState.Open &&
      quietCheck,
    async (value) => {
      if (!value) return
      try {
        fetchContactInfo()
      } catch {
        // Suppress error
      }
    },
    { immediate: true }
  )

  return {
    contactInfo,
    requiresCheck,
    fetchContactInfo,
    saveContactInfo
  }
}
