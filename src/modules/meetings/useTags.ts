import { InjectionKey, onMounted, onUpdated, Ref } from '@vue/runtime-core'
import stringToHSL from '@/utils/stringToHSL'
import { DefaultMap } from '@/utils'

// Automatic FIFO-cache, keep 30
const cache = new DefaultMap<string, string>(stringToHSL, 30)

export const TagsKey: InjectionKey<Ref<Set<string>>> = Symbol('tags')

export default function useTags (el: Ref<HTMLElement | null>) {
  function setTagColors () {
    if (!el.value) return
    for (const elem of <NodeListOf<HTMLElement>>el.value.querySelectorAll('.mention[data-denotation-char="#"]')) {
      elem.style.backgroundColor = cache.get(elem.dataset.value ?? '')
    }
  }

  onMounted(setTagColors)
  onUpdated(setTagColors)
}
