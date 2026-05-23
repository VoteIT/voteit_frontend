<script setup lang="ts">
import { ComponentPublicInstance, ref, watch } from 'vue'
import { useTextSelection } from '@vueuse/core'

import Tag from '@/components/Tag.vue'

import AuthorName from '../meetings/AuthorName.vue'

import { Proposal } from './types'
import ProposalText from './ProposalText.vue'

const props = defineProps<{
  proposal: Proposal
  selected?: boolean
  selection?: { start: number; end: number }
}>()

const emit = defineEmits<{
  (e: 'update:selection', value?: { start: number; end: number }): void
}>()

const textEl = ref<ComponentPublicInstance>()

function isText(el: Node): el is Text {
  return el.nodeType === el.TEXT_NODE
}

watch(
  () => props.selected,
  (value) => {
    if (!value) return
    const containerEl = textEl.value?.$el as HTMLElement
    containerEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
)

watch(
  () => props.selection,
  (selection) => {
    if (!selection) return
    const containerEl = textEl.value?.$el as HTMLElement
    const sel = window.getSelection()
    if (!sel || !selection || !containerEl) return
    let charIndex = 0
    const range = document.createRange()
    range.setStart(containerEl, 0)
    range.collapse(true)
    const nodeStack: Node[] = [containerEl]
    let node: Node | undefined
    let foundStart = false
    let stop = false

    while (!stop && (node = nodeStack.pop())) {
      if (isText(node)) {
        var nextCharIndex = charIndex + node.length
        if (
          !foundStart &&
          selection.start >= charIndex &&
          selection.start <= nextCharIndex
        ) {
          range.setStart(node, selection.start - charIndex)
          foundStart = true
        }
        if (
          foundStart &&
          selection.end >= charIndex &&
          selection.end <= nextCharIndex
        ) {
          range.setEnd(node, selection.end - charIndex)
          stop = true
        }
        charIndex = nextCharIndex
      } else {
        // Add in reverse order
        var i = node.childNodes.length
        while (i--) nodeStack.push(node.childNodes[i])
      }
    }
    sel.removeAllRanges()
    sel.addRange(range)
  },
  { immediate: true }
)

const { ranges } = useTextSelection()
let hasSelection = false

watch(
  () => ranges.value.at(0),
  (range) => {
    // No selection
    const elem = textEl.value?.$el as HTMLElement | undefined
    if (!elem || !range?.toString().length) {
      if (!hasSelection) return
      hasSelection = false
      return emit('update:selection', undefined)
    }
    if (!range.intersectsNode(elem)) return
    hasSelection = true
    const startRange = document.createRange()
    startRange.setStart(elem, 0)
    startRange.setEnd(range.startContainer, range.startOffset)
    const start = startRange.toString().length
    const end = Math.min(elem.innerText.length, start + range.toString().length)
    emit('update:selection', { start, end })
  }
)
</script>

<template>
  <v-sheet rounded :elevation="selected ? 8 : 0" :class="{ selected }">
    <div class="pa-4">
      <div class="d-flex ga-1">
        <div class="flex-grow-1 mb-3">
          <Tag :name="proposal.prop_id" />
        </div>
        <slot name="actions"></slot>
      </div>
      <ProposalText :proposal="proposal" ref="textEl" />
      <div class="text-secondary">
        <AuthorName :author="proposal" icon :prepend-text="$t('by')" />
      </div>
      <v-defaults-provider :defaults="{ VBtn: { size: 'small' } }">
        <slot name="append"></slot>
      </v-defaults-provider>
    </div>
    <slot name="bottom"></slot>
  </v-sheet>
</template>

<style scoped lang="sass">
.v-sheet
  transition: transform 400ms, box-shadow 400ms
  &.selected
    transform: scale(1.005)
    ::selection
      background-color: rgb(var(--v-theme-accent))
      color: rgb(var(--v-theme-on-accent))
</style>
