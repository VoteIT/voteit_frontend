import { Ref, computed, onBeforeMount, ref, watch } from 'vue'

import restApi from '@/utils/restApi'
import { Meeting } from './types'
import { meetingInviteAnnotationPlugins } from './registry'

interface InviteDataType {
  is_annotation: boolean
  is_clearable: boolean
  is_user_data: boolean
  name: string
  title: string
}

const inviteDataTypes = ref<InviteDataType[] | null>(null)

function filterDataTypes(
  meeting?: Meeting,
  filter: (dt: InviteDataType) => boolean = () => true
) {
  if (!meeting || !inviteDataTypes.value) return []
  return inviteDataTypes.value.filter((dt) => {
    const isActive = meetingInviteAnnotationPlugins
      .getPlugin(dt.name)
      ?.checkActive?.(meeting)
    return (
      // undefined or true is OK
      isActive !== false && filter(dt)
    )
  })
}

export default function useInviteAnnotations(
  meeting: Ref<Meeting | undefined>
) {
  const fetchFailed = ref(false)

  async function fetchDataTypes() {
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

  // Filtered data types or empty lists if not fetched yet.
  const allDataTypes = computed(() => filterDataTypes(meeting.value))
  const annotationDataTypes = computed(() =>
    filterDataTypes(meeting.value, (dt) => dt.is_annotation)
  )
  const clearableDataTypes = computed(() =>
    filterDataTypes(meeting.value, (dt) => dt.is_clearable)
  )

  return {
    allDataTypes,
    annotationDataTypes,
    clearableDataTypes,
    fetchFailed,
    fetchDataTypes // Allows retrying
  }
}
