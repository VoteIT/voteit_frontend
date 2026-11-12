<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { openModal } from '@/utils/modal'
import { ThemeColor } from '@/utils/types'
import Tag from '@/components/Tag.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useAgendaStore from '../agendas/useAgendaStore'

import { ProposalText, proposalTextType } from './contentTypes'
import EditTextDocumentModal from './EditProposalTextModal.vue'
import AddTextProposalModal from './AddTextProposalModal.vue'
import ParagraphProposalsDialog from './ParagraphProposalsDialog.vue'
import { isDiffProposal } from './types'
import useProposalStore from './useProposalStore'
import { canChangeDocument, canDeleteDocument, canAddProposal } from './rules'

const props = defineProps<{
  document: ProposalText
}>()

const { t } = useI18n()
const { handled } = useErrorHandler({ target: 'dialog' })

const { anyAiProposal, countAiProposals } = useProposalStore()
const { getAgendaItem } = useAgendaStore()

const perms = computed(() => {
  const ai = getAgendaItem(props.document.agenda_item)
  return {
    change: canChangeDocument(props.document),
    delete: canDeleteDocument(props.document),
    addProposal: !!ai && canAddProposal(ai)
  }
})

const proposalCount = computed(() => {
  const mapping: Record<string, number> = {}
  for (const p of props.document.paragraphs) {
    mapping[p.tag] = countAiProposals(props.document.agenda_item, (prop) =>
      prop.tags.includes(p.tag)
    )
  }
  return mapping
})

/** Paragraphs that have change proposals, in document order */
const changedParagraphs = computed(() =>
  props.document.paragraphs.filter((p) =>
    anyAiProposal(
      props.document.agenda_item,
      (prop) => isDiffProposal(prop) && prop.paragraph === p.pk
    )
  )
)
const changedPks = computed(
  () => new Set(changedParagraphs.value.map((p) => p.pk))
)
const dialogParagraph = ref<number>()

function editDocument() {
  openModal({
    title: t('proposal.textModify'),
    component: EditTextDocumentModal,
    props: { data: props.document }
  })
}
async function deleteDocument() {
  if (
    await dialogQuery({
      title: t('proposal.textDeleteConfirm'),
      theme: ThemeColor.Warning
    })
  )
    await handled(() => proposalTextType.api.delete(props.document.pk))
}

const collapsed = ref(false)
</script>

<template>
  <v-card class="my-2 proposal-text" :border="true" :title="document.title">
    <template #append>
      <v-btn
        v-if="perms.change"
        icon="mdi-pencil"
        variant="text"
        @click="editDocument"
      />
      <v-btn
        v-if="perms.delete"
        icon="mdi-delete"
        variant="text"
        color="warning"
        @click="deleteDocument"
      />
      <v-btn
        variant="text"
        icon="mdi-chevron-up"
        :class="{ collapsed }"
        @click="collapsed = !collapsed"
      />
    </template>
    <v-expand-transition>
      <div v-show="!collapsed">
        <template v-for="p in document.paragraphs" :key="p.pk">
          <v-divider />
          <v-card-text>
            <Tag :name="p.tag" />
            <p class="mt-2 proposal-text-paragraph">{{ p.body }}</p>
          </v-card-text>
          <v-card-actions v-if="perms.addProposal || changedPks.has(p.pk)">
            <AddTextProposalModal v-if="perms.addProposal" :paragraph="p">
              <template #activator="{ props }">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-text-box-plus-outline"
                  size="small"
                  :text="$t('proposal.change')"
                  variant="flat"
                  v-bind="props"
                />
              </template>
            </AddTextProposalModal>
            <v-badge
              v-if="changedPks.has(p.pk)"
              color="secondary"
              :content="proposalCount[p.tag]"
            >
              <v-btn
                prepend-icon="mdi-text-box-search-outline"
                size="small"
                :text="$t('proposal.showParagraphProposals')"
                variant="tonal"
                @click="dialogParagraph = p.pk"
              />
            </v-badge>
          </v-card-actions>
        </template>
      </div>
    </v-expand-transition>
    <ParagraphProposalsDialog
      v-model="dialogParagraph"
      :document="document"
      :paragraphs="changedParagraphs"
    />
  </v-card>
</template>

<style lang="sass">
.proposal-text
  .mdi-chevron-up
    transition: transform 250ms
  .collapsed .mdi-chevron-up
    transform: rotate(180deg)
.proposal-text-paragraph
  white-space: pre-line

  .text-diff-removed
    color: rgb(var(--v-theme-warning))
    text-decoration: line-through
    font-weight: 700
  .text-diff-added
    color: rgb(var(--v-theme-success))
    font-weight: 700
    text-decoration: underline
</style>
