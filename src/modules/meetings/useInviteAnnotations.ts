import { computed, onBeforeMount, ref, watch } from 'vue'

import restApi from '@/utils/restApi'

interface InviteDataType {
  is_annotation: boolean
  is_clearable: boolean
  is_user_data: boolean
  name: string
  title: string
}

const inviteDataTypes = ref<InviteDataType[] | null>(null)

function filterDataTypes (filter?: (dt: InviteDataType) => boolean) {
  if (!inviteDataTypes.value) return []
  if (!filter) return inviteDataTypes.value
  return inviteDataTypes.value.filter(filter)
}

// Filtered data types or empty lists if not fetched yet.
const allDataTypes = computed(() => filterDataTypes())
const annotationDataTypes = computed(() => filterDataTypes(dt => dt.is_annotation))
const clearableDataTypes = computed(() => filterDataTypes(dt => dt.is_clearable))

export default function useInviteAnnotations () {
  const fetchFailed = ref(false)

  async function fetchDataTypes () {
    if (inviteDataTypes.value) return
    try {
      const { data } = await restApi.get<InviteDataType[]>('invite-data-types/')
      inviteDataTypes.value = data
    } catch {
      fetchFailed.value = true
    }
  }

  onBeforeMount(fetchDataTypes)
  watch(inviteDataTypes, () => {
    // If this changes, some fetch has succeeded
    fetchFailed.value = false
  })

  return {
    allDataTypes,
    annotationDataTypes,
    clearableDataTypes,
    fetchFailed,
    fetchDataTypes // Allows retrying
  }
}
