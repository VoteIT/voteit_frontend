import { computed } from 'vue'

import useMeeting from './useMeeting'
import { isActiveMeeting } from './rules'
import useMeetingComponent from './useMeetingComponent'

/**
 * Whether the meeting dialect blocks or requires a component, and whether a
 * required component is turned off.
 */
export default function useRequiredComponent(componentName: string) {
  const { meeting, meetingId } = useMeeting()
  const isBlocked = computed(
    () => !!meeting.value?.dialect?.block_components?.includes(componentName)
  )
  const isRequired = computed(
    () =>
      isActiveMeeting(meeting.value) &&
      (meeting.value?.dialect?.configure_components || []).some(
        ({ name }) => name === componentName
      )
  )
  const meetingComponent = useMeetingComponent(meetingId, componentName)
  const warnRequired = computed(
    () => !meetingComponent.componentActive.value && isRequired.value
  )
  return { ...meetingComponent, isBlocked, isRequired, warnRequired }
}
