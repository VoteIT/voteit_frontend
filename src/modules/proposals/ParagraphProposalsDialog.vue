<script lang="ts" setup>
import { computed } from 'vue'
import { onKeyStroke } from '@vueuse/core'

import DefaultDialog from '@/components/DefaultDialog.vue'
import Tag from '@/components/Tag.vue'

import ProposalSheet from './ProposalSheet.vue'
import useProposalStore from './useProposalStore'
import type { ProposalText, TextParagraph } from './contentTypes'

const props = defineProps<{
  document: ProposalText
  /** Paragraphs that have change proposals, in document order */
  paragraphs: TextParagraph[]
}>()

/** pk of the paragraph being shown */
const current = defineModel<number | undefined>()

const { getAiProposals } = useProposalStore()

const index = computed(() =>
  props.paragraphs.findIndex((p) => p.pk === current.value)
)
const paragraph = computed(() => props.paragraphs[index.value])
const previous = computed(() => props.paragraphs[index.value - 1])
const next = computed(() =>
  index.value === -1 ? undefined : props.paragraphs[index.value + 1]
)

const proposals = computed(() => {
  const tag = paragraph.value?.tag
  if (!tag) return []
  return getAiProposals(props.document.agenda_item, (prop) =>
    prop.tags.includes(tag)
  )
})

const isOpen = computed({
  get: () => !!paragraph.value,
  set: (value) => {
    if (!value) current.value = undefined
  }
})

/**
 * navigationEventAllowed() rejects events from inside overlays, which is
 * exactly where these come from, so check modifiers and text inputs here.
 */
function keyNavAllowed(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false
  return !(e.target instanceof Element && e.target.closest('input, textarea'))
}

// Every TextDocument has its own dialog, so only the open one may react
function keyNav(key: string, target: () => TextParagraph | undefined) {
  onKeyStroke(
    (e) => e.key === key && isOpen.value && keyNavAllowed(e),
    (e) => {
      const paragraph = target()
      if (!paragraph) return
      e.preventDefault()
      current.value = paragraph.pk
    }
  )
}
keyNav('ArrowLeft', () => previous.value)
keyNav('ArrowRight', () => next.value)
</script>

<template>
  <DefaultDialog
    color="background"
    :title="document.title"
    width="920"
    v-model="isOpen"
  >
    <template v-if="paragraph">
      <v-sheet border rounded class="pa-4">
        <Tag :name="paragraph.tag" />
        <p class="mt-2 proposal-text-paragraph">{{ paragraph.body }}</p>
      </v-sheet>
      <v-divider class="my-6" gradient>{{
        $t('proposal.changeProposalCount', proposals.length)
      }}</v-divider>
      <div class="d-flex flex-column ga-3">
        <ProposalSheet
          v-for="prop in proposals"
          border
          :key="prop.pk"
          :proposal="prop"
        />
      </div>
      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          v-if="previous"
          prepend-icon="mdi-chevron-left"
          variant="tonal"
          @click="current = previous.pk"
        >
          {{ $t('navigation.previous') }}: #{{ previous.tag }}
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="next"
          append-icon="mdi-chevron-right"
          variant="tonal"
          @click="current = next.pk"
        >
          {{ $t('navigation.next') }}: #{{ next.tag }}
        </v-btn>
      </div>
    </template>
  </DefaultDialog>
</template>
