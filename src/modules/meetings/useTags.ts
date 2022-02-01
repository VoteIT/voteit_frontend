import { InjectionKey, onMounted, onUpdated, Ref, watch } from '@vue/runtime-core'
import stringToHSL from '@/utils/stringToHSL'
import { slugify } from '@/utils'
import TypedEvent from '@/utils/TypedEvent'
import DefaultMap from '@/utils/DefaultMap'

// Automatic FIFO-cache, keep 30
const cache = new DefaultMap<string, string>(stringToHSL, 30)
const domParser = new DOMParser()

export const TagsKey: InjectionKey<Ref<Set<string>>> = Symbol('tags')
export const tagClickEvent = new TypedEvent<string>()

export default function useTags (el?: Ref<HTMLElement | null>) {
  function setTagColors (container: HTMLElement) {
    for (const tagElem of <NodeListOf<HTMLElement>>container.querySelectorAll('.mention[data-denotation-char="#"]')) {
      tagElem.style.backgroundColor = cache.get(tagElem.dataset.value ?? '')
    }
  }

  function clickHandler (evt: MouseEvent) {
    const tagElem = evt.composedPath().find(elem => (elem as HTMLElement).dataset?.denotationChar === '#') as HTMLElement | null
    if (tagElem?.dataset.value && !tagElem.classList.contains('disabled')) tagClickEvent.emit(tagElem.dataset.value)
  }

  if (el) {
    onMounted(() => {
      if (!el.value) return
      el.value.addEventListener('click', clickHandler)
      setTagColors(el.value)
    })
    onUpdated(() => {
      if (el.value) setTagColors(el.value)
    })
    watch(el, elem => {
      if (elem) elem.addEventListener('click', clickHandler)
    })
  }

  function getHTMLTags (html: string): Set<string> {
    const body = domParser.parseFromString(html, 'text/html')
    const docTags = new Set<string>()
    for (const tagElem of body.querySelectorAll<HTMLElement>('[data-denotation-char="#"]')) {
      docTags.add(slugify(tagElem.dataset.value as string))
    }
    return docTags
  }

  return {
    getHTMLTags
  }
}
