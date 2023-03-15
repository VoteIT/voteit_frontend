import { filter } from 'itertools'
import { computed, reactive, Ref } from 'vue'

import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'

const meetingComponents = reactive(new Map<number, ComponentBase>())

meetingComponentType.updateMap(meetingComponents)

export default function useMeetingComponent<T extends ComponentBase> (meeting: Ref<number>, name: string) {
  function isNamedComponent (component: ComponentBase): component is T {
    return component.meeting === meeting.value && component.component_name === name
  }
  const components = computed(() => filter(meetingComponents.values(), isNamedComponent))
  const component = computed(() => components.value[0] as T | undefined)

  const componentActive = computed(() => component.value?.state === 'on')

  return {
    component,
    componentActive
  }
}
