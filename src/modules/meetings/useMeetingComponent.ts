import { filter, first } from 'itertools'
import { computed, MaybeRef, reactive, unref } from 'vue'

import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'
import { UnguardedTransition } from '@/contentTypes/useTransitions'

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
  const componentActive = computed(() => component.value?.state === 'on')

  async function setComponentState(state: boolean) {
    if (!component.value) throw new Error(`No component loaded`)
    await meetingComponentType.transitions.make(
      component.value,
      state ? 'enable' : 'disable',
      UnguardedTransition
    )
  }

  async function addComponent(settings: T['settings'], activate = false) {
    const { data } = await meetingComponentType.api.add({
      component_name: name,
      meeting: unref(meeting),
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
