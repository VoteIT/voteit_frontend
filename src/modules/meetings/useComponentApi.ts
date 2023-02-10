import { computed, ref, Ref } from 'vue'
import { meetingComponentType } from './contentTypes'
import { ComponentBase } from './types'

// TODO: Deprecate? This seems to hugely double for useMeetingComponent?
const meetingComponents = ref<ComponentBase[]>([])

export default function useComponentApi<T extends ComponentBase = ComponentBase> (meeting: Ref<number>, name?: string) {
  function isNamedComponent (component: ComponentBase): component is T {
    return !name || component.component_name === name
  }

  const components = computed(() => meetingComponents.value.filter(isNamedComponent))
  const component = computed(() => {
    if (!name || name === '') return // Javascript, I hate you!
    return components.value[0]
  })

  async function fetchComponents () {
    const { data } = await meetingComponentType.api.list({ meeting: meeting.value })
    meetingComponents.value = data
  }

  function clearComponents () {
    meetingComponents.value = []
  }

  async function addComponent (settings: T['settings'], activate = false) {
    if (!meeting.value) throw new Error('Can\'t create meeting component without meeting id')
    const { data } = await meetingComponentType.api.add({
      component_name: name,
      meeting: meeting.value,
      settings
    })
    meetingComponents.value.push(data)
    if (activate) setComponentState(data as T, true)
    return data
  }

  function setReactiveState (pk: number, state: T['state']) {
    for (const component of meetingComponents.value) {
      if (component.pk === pk) {
        component.state = state
        return
      }
    }
  }

  async function setComponentState ({ pk }: T, state: boolean) {
    const { data } = await meetingComponentType.api.transition(
      pk,
      state
        ? 'enable'
        : 'disable'
    )
    if (data.state) setReactiveState(pk, data.state)
  }

  return {
    component, // Only if called by name
    components,
    addComponent,
    clearComponents,
    setComponentState,
    fetchComponents
  }
}
