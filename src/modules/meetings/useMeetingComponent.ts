import { computed, reactive, Ref } from 'vue'

import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'

const meetingComponents = reactive(new Map<number, ComponentBase>())

meetingComponentType.updateMap(meetingComponents)

function * filterComponents (meeting: number, filter: (component: ComponentBase) => boolean) {
  for (const component of meetingComponents.values()) {
    if (component.meeting === meeting && filter(component)) yield component
  }
}

export default function useMeetingComponents<T extends ComponentBase> (meeting: Ref<number>, name: string) {
  const components = computed(() => [...filterComponents(meeting.value, c => c.component_name === name)] as T[])
  const component = computed(() => components.value[0] as T | undefined)

  return {
    component
  }
}
