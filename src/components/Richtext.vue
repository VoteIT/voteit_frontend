<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useElementBounding } from '@vueuse/core'

import useTags from '@/modules/meetings/useTags'

const props = defineProps<{
  maxHeight?: number
  value: string
}>()

const EXTERNAL_ICON_CLASSES = [
  'mdi-open-in-new',
  'mdi',
  'v-icon',
  'notranslate',
  'v-theme--light',
  'v-icon--size-x-small'
]

const { t } = useI18n()
const router = useRouter()

watch(
  () => props.value,
  () => nextTick(addExternalIcons)
)

const contentElem = ref<HTMLElement | null>(null)
useTags(contentElem)
const { height } = useElementBounding(contentElem)
const isOverflowing = computed(
  () => !!props.maxHeight && height.value > props.maxHeight + 72
) // Add 72 for double btn height
const userExpanded = ref<null | boolean>(null)
const expandIcon = computed(
  () => `mdi-chevron-${userExpanded.value ? 'up' : 'down'}`
)
const style = computed(() => {
  if (!isOverflowing.value) return
  return {
    maxHeight: userExpanded.value ? '80000px' : `${props.maxHeight || 0}px`
  }
})

function isExternal(anchor: HTMLAnchorElement): boolean {
  return anchor.host !== location.host
}

function addExternalIcons() {
  if (!contentElem.value) return
  for (const anchor of contentElem.value.querySelectorAll<HTMLAnchorElement>(
    'a[href]'
  )) {
    if (!isExternal(anchor)) continue
    const icon = document.createElement('sup')
    EXTERNAL_ICON_CLASSES.forEach((c) => icon.classList.add(c))
    anchor.append(icon)
  }
}

// Force external links to open in new tab
watch(contentElem, (el) => {
  if (!el) return
  function getAnchorElement(
    current: HTMLElement | null
  ): HTMLAnchorElement | undefined {
    // Move up the tree until we get to container or an anchor
    while (current && current !== el) {
      if (current.tagName === 'A' && 'href' in current)
        return current as HTMLAnchorElement
      current = current.parentElement
    }
  }
  el.addEventListener('click', (event) => {
    const anchor = getAnchorElement(event.target as HTMLElement)
    if (!anchor) return
    event.preventDefault()
    if (isExternal(anchor)) return window.open(anchor.href, '_blank')
    const url = new URL(anchor.href)
    router.push(url.pathname)
  })
  addExternalIcons()
})
</script>

<template>
  <div>
    <div class="overflow-hidden position-relative" :style="style">
      <div ref="contentElem" class="richtext" v-html="value"></div>
      <div class="overflow-fade" v-show="isOverflowing && !userExpanded"></div>
    </div>
    <v-btn
      block
      v-if="isOverflowing"
      variant="text"
      color="primary"
      @click="userExpanded = !userExpanded"
      :append-icon="expandIcon"
    >
      {{ userExpanded ? t('collapse') : t('expand') }}
    </v-btn>
  </div>
</template>

<style lang="sass">
.richtext
  margin: .4em 0
  ul, ol
    padding-left: 2.5em
  blockquote
    border-left: 3px solid rgb(var(--v-border-color))
    padding: .2em 0 .2em .6em
    font-style: italic
  ol, ul, blockquote, p
    margin-bottom: .5em
    line-height: 1.3em
  ol, ul, blockquote, p, h2, h3, h4
    &.ql-indent-1
      margin-left: 2em
    &.ql-indent-2
      margin-left: 4em
    &.ql-indent-3
      margin-left: 6em
    &.ql-indent-4
      margin-left: 8em
    &.ql-align-center
      text-align: center
    &.ql-align-right
      text-align: right
    &.ql-align-justify
      text-align: justify
      img
        width: 100%

  iframe.ql-video
    width: 100%
    max-width: 920px
    aspect-ratio: 16/9
    display: block
    &.ql-align-justify
      max-width: unset
    &.ql-align-center
      margin: 0 auto
    &.ql-align-right
      margin-left: auto
  img
    max-width: 100%
  code
    color: rgb(var(--v-theme-secondary))

.richtext,
.ql-editor
  p
    font-size: 10.5pt
    line-height: 1.5
  .mention
    background-color: rgba(var(--v-theme-primary), .3)
    white-space: nowrap
    padding: .05em .6em
    border-radius: 4px
    font-size: 10pt

.overflow-fade
  position: absolute
  bottom: 0
  width: 100%
  height: 64px
  background: linear-gradient(rgba(var(--v-theme-background), 0), rgba(var(--v-theme-background), 1))
</style>
