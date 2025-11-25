import { imap } from 'itertools'
import { inject, InjectionKey, onMounted, onUpdated, Ref, watch } from 'vue'

import { tagify } from '@/utils'
import stringToHSL from '@/utils/stringToHSL'
import DefaultMap from '@/utils/DefaultMap'

// Automatic FIFO-cache, keep 30
const cache = new DefaultMap<string, string>(stringToHSL, 30)
const domParser = new DOMParser()

export const TagsKey: InjectionKey<Ref<Set<string>>> = Symbol('tags')
export const TagClickHandlerKey = Symbol('tagClickHandler') as InjectionKey<
  (tag: string) => void
>

function setTagColors(container: HTMLElement) {
  for (const tagElem of container.querySelectorAll<HTMLElement>(
    '.mention[data-denotation-char="#"]'
  ))
    tagElem.style.backgroundColor = cache.get(tagElem.dataset.value ?? '')
}

export function getHTMLTags(html: string) {
  const tagElems = domParser
    .parseFromString(html, 'text/html')
    .querySelectorAll<HTMLElement>('[data-denotation-char="#"]')
  return new Set(imap(tagElems, (elem) => tagify(elem.dataset.value!)))
}

function isHTMLElement(el: EventTarget): el is HTMLElement {
  return 'dataset' in el
}

export default function useTags(el?: Ref<HTMLElement | null>) {
  const outerClickHandler = inject(TagClickHandlerKey, undefined)

  if (el) {
    function clickHandler(ev: MouseEvent) {
      if (!outerClickHandler || !ev.target || !isHTMLElement(ev.target)) return
      const tagElem = ev.target.closest<HTMLElement>(
        '[data-denotation-char="#"]'
      )
      if (tagElem?.dataset.value && !tagElem.classList.contains('disabled'))
        outerClickHandler(tagElem.dataset.value)
    }

    onMounted(() => {
      if (!el.value) return
      el.value.addEventListener('click', clickHandler)
      setTagColors(el.value)
    })
    onUpdated(() => {
      if (el.value) setTagColors(el.value)
    })
    watch(el, (elem) => {
      if (elem) elem.addEventListener('click', clickHandler)
    })
  }
}
