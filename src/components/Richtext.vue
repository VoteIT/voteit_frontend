<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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
  el.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement).closest('a')
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
    <div
      class="overflow-hidden position-relative"
      :class="{ 'overflow-fade': isOverflowing && !userExpanded }"
      :style="style"
    >
      <div ref="contentElem" class="ql-editor pa-0" v-html="value"></div>
    </div>
    <v-btn
      v-if="isOverflowing"
      :append-icon="expandIcon"
      block
      color="primary"
      :text="userExpanded ? $t('collapse') : $t('expand')"
      variant="text"
      @click="userExpanded = !userExpanded"
    />
  </div>
</template>

<style lang="sass">
.ql-editor
  .ql-align-justify
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
  blockquote
    border-left: 3px solid rgb(var(--v-border-color))
    padding: .2em 0 .2em .6em
    font-style: italic
  code
    color: rgb(var(--v-theme-secondary))
  p
    font-size: 10.5pt
    line-height: 1.5
  // Mimics <v-chip size="x-small" variant="flat"> as rendered by Tag.vue
  .mention
    display: inline-flex
    align-items: center
    vertical-align: middle
    width: auto
    height: 20px
    padding: 0 8px
    margin-right: 0
    border-radius: 9999px
    background-color: rgba(var(--v-theme-primary), .3)
    font-size: .625rem
    line-height: 1
    white-space: nowrap
    > span
      margin: 0
    &[data-denotation-char="#"]
      color: #000

// Set by useTags on containers where a tag click does something
.tags-clickable .mention[data-denotation-char="#"]
  cursor: pointer

.overflow-fade
  clip-path: inset(0)

  & ::after
    content: ""
    position: absolute
    inset: auto 0 0 0
    height: 64px
    background: linear-gradient(rgba(var(--v-theme-background), 0), rgba(var(--v-theme-background), 1))
</style>
