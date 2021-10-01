import { InjectionKey, onMounted, onUpdated, Ref } from '@vue/runtime-core'
import stringToHSL from '@/utils/stringToHSL'
import { DefaultMap } from '@/utils'

// Automatic FIFO-cache, keep 30
const cache = new DefaultMap<string, string>(stringToHSL, 30)
const domParser = new DOMParser()

export const TagsKey: InjectionKey<Ref<Set<string>>> = Symbol('tags')

export default function useTags (el?: Ref<HTMLElement | null>) {
  function setTagColors () {
    if (!el?.value) return
    for (const elem of <NodeListOf<HTMLElement>>el.value.querySelectorAll('.mention[data-denotation-char="#"]')) {
      elem.style.backgroundColor = cache.get(elem.dataset.value ?? '')
    }
  }

  if (el) {
    onMounted(setTagColors)
    onUpdated(setTagColors)
  }

  function getHTMLTags (html: string): Set<string> {
    const body = domParser.parseFromString(html, 'text/html')
    const docTags = new Set<string>()
    for (const tagElem of body.querySelectorAll<HTMLElement>('[data-denotation-char="#"]')) {
      docTags.add(tagElem.dataset.value as string)
    }
    return docTags
  }

  return {
    getHTMLTags
  }
}
