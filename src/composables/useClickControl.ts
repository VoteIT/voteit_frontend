import { Ref } from '@vue/reactivity'
import { ComponentPublicInstance, onBeforeMount, onBeforeUnmount } from '@vue/runtime-core'

interface ElementCallback {
  element: Ref<ComponentPublicInstance | null>
  callback: () => void
}
const clickedOutsideCallbacks: Set<ElementCallback> = new Set()

document.addEventListener('mousedown', evt => {
  for (const { element, callback } of clickedOutsideCallbacks) {
    if (element.value && !evt.composedPath().includes(element.value.$el)) callback()
  }
})

export default function useClickControl (elementCallback: ElementCallback) {
  onBeforeMount(() => {
    clickedOutsideCallbacks.add(elementCallback)
  })
  onBeforeUnmount(() => {
    clickedOutsideCallbacks.delete(elementCallback)
  })
}
