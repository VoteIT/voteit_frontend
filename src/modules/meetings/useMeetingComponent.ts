import { first } from 'itertools'
import { computed, MaybeRef, reactive, unref } from 'vue'

import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'

const meetingComponents = reactive(new Map<number, ComponentBase>())

meetingComponentType.updateMap(meetingComponents, { meeting: 'meeting' })

export default function useMeetingComponent<T extends ComponentBase>(
  meeting: MaybeRef<number>,
  name: string
) {
  const component = computed(() =>
    first(
      meetingComponents.values(),
      (c) => c.meeting === unref(meeting) && c.component_name === name
    )
  )
  const componentActive = computed(() => component.value?.enabled ?? false)

  async function setComponentState(enabled: boolean) {
    if (!component.value) throw new Error(`No component loaded`)
    await meetingComponentType.api.patch(component.value.pk, { enabled })
  }

  async function addComponent(settings: T['settings'], enabled = false) {
    const data = await meetingComponentType.api.add({
      component_name: name,
      enabled,
      meeting: unref(meeting),
      settings
    })
    meetingComponents.set(data.pk, data)
  }

  return {
    component,
    componentActive,
    addComponent,
    setComponentState
  }
}
