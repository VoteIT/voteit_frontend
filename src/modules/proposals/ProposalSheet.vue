<script setup lang="ts">
import { ComponentPublicInstance, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Tag from '@/components/Tag.vue'

import AuthorName from '../meetings/AuthorName.vue'
import { proposalSelectionEvent } from '../rooms/events'

import { Proposal } from './types'
import ProposalText from './ProposalText.vue'

const { t } = useI18n()

const props = defineProps<{
  proposal: Proposal
  selectInRoom?: number
}>()

const selected = ref(false)
const textEl = ref<ComponentPublicInstance>()

function isText(el: Node): el is Text {
  return el.nodeType === el.TEXT_NODE
}

function select(savedSel: { start: number; end: number }) {
  selected.value = true
  const containerEl = textEl.value?.$el as HTMLElement
  const sel = window.getSelection()
  if (!sel || !savedSel || !containerEl) return
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
        savedSel.start >= charIndex &&
        savedSel.start <= nextCharIndex
      ) {
        range.setStart(node, savedSel.start - charIndex)
        foundStart = true
      }
      if (
        foundStart &&
        savedSel.end >= charIndex &&
        savedSel.end <= nextCharIndex
      ) {
        range.setEnd(node, savedSel.end - charIndex)
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
  containerEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const evt = proposalSelectionEvent.on((evt) => {
  if (evt.room === props.selectInRoom && evt.proposal === props.proposal.pk)
    return select(evt)
  selected.value = false
})
onBeforeUnmount(evt.dispose)
</script>

<template>
  <v-sheet rounded :elevation="selected ? 12 : 0" :class="{ selected }">
    <div class="pa-4">
      <div class="d-flex">
        <div class="flex-grow-1 mb-3">
          <Tag :name="proposal.prop_id" />
        </div>
        <slot name="actions"></slot>
      </div>
      <ProposalText :proposal="proposal" ref="textEl" />
      <div class="text-secondary">
        <AuthorName :author="proposal" icon :prepend-text="t('by')" />
      </div>
      <slot name="append"></slot>
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
