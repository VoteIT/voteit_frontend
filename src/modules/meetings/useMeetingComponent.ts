import { filter, first } from 'itertools'
import { computed, reactive, Ref } from 'vue'

import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'
import { UnguardedTransition } from '@/contentTypes/useTransitions'

const meetingComponents = reactive(new Map<number, ComponentBase>())

meetingComponentType.updateMap(meetingComponents, { meeting: 'meeting' })

export default function useMeetingComponent<T extends ComponentBase>(
  meeting: Ref<number>,
  name: string
) {
  const component = computed(() =>
    first(
      meetingComponents.values(),
      (c) => c.meeting === meeting.value && c.component_name === name
    )
  )
  const componentActive = computed(() => component.value?.state === 'on')

  async function setComponentState(state: boolean) {
    if (!component.value) throw new Error(`No component loaded`)
    const response = await meetingComponentType.transitions.make(
      component.value,
      state ? 'enable' : 'disable',
      UnguardedTransition
    )
  }

  async function addComponent(settings: T['settings'], activate = false) {
    if (!meeting.value)
      throw new Error("Can't create meeting component without meeting id")
    const { data } = await meetingComponentType.api.add({
      component_name: name,
      meeting: meeting.value,
      settings
    })
    meetingComponents.set(data.pk, data)
    if (activate) setComponentState(true)
  }

  return {
    component,
    componentActive,
    addComponent,
    setComponentState
  }
}
