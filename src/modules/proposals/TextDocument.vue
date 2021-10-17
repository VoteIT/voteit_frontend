<template>
  <v-card class="my-2" border>
    <v-card-title>
      <!-- Empty title not really allowed, so no translation needed here -->
      {{ document.title || '-- text document --' }}
      <v-spacer/>
      <v-btn v-if="canChangeDocument" icon="mdi-pencil" variant="text" @click="editDocument()" />
      <v-btn v-if="canDeleteDocument" icon="mdi-delete" variant="text" color="warning" @click="deleteDocument()" />
    </v-card-title>
    <template v-for="p in document.paragraphs" :key="p.pk">
      <v-divider/>
      <v-card-text>
        <Tag :name="p.tag" :count="proposalCount[p.tag]" />
        <p class="mt-2 proposal-text-paragraph">{{ p.body }}</p>
      </v-card-text>
      <v-card-actions v-if="canAddProposal">
        <v-btn size="small" prepend-icon="mdi-text-box-plus-outline" color="primary" @click="addProposal(p)">{{ t('proposal.change') }}</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>

<script lang="ts">
import { dialogQuery, openModalEvent } from '@/utils'
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ProposalText, proposalTextType, TextParagraph } from './contentTypes'
import useProposals from './useProposals'
import useTextDocument from './useTextDocument'
import EditTextDocumentModal from './EditProposalTextModal.vue'
import { ThemeColor } from '@/utils/types'
import AddTextProposalModalVue from './AddTextProposalModal.vue'

export default defineComponent({
  props: {
    document: {
      type: Object as PropType<ProposalText>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getAgendaProposals } = useProposals()
    const proposalCount = computed(() => {
      const mapping: Record<string, number> = {}
      for (const p of props.document.paragraphs) {
        mapping[p.tag] = getAgendaProposals(props.document.agenda_item, prop => prop.tags.includes(p.tag)).length
      }
      return mapping
    })

    function editDocument () {
      openModalEvent.emit({
        title: t('proposal.textModify'),
        component: EditTextDocumentModal,
        data: props.document
      })
    }
    async function deleteDocument () {
      if (await dialogQuery({
        title: t('proposal.textDeleteConfirm'),
        theme: ThemeColor.Warning
      })) proposalTextType.api.delete(props.document.pk)
    }

    function addProposal (data: TextParagraph) {
      openModalEvent.emit({
        title: t('proposal.change'),
        component: AddTextProposalModalVue,
        data
      })
    }

    return {
      t,
      proposalCount,
      addProposal,
      deleteDocument,
      editDocument,
      ...useTextDocument(ref(props.document))
    }
  }
})
</script>

<style lang="sass">
.proposal-text-paragraph
  white-space: pre-line

  .text-diff-removed
    color: rgb(var(--v-theme-warning))
    text-decoration: line-through
    font-weight: 700
  .text-diff-added
    color: rgb(var(--v-theme-success-darken-2))
    font-weight: 700
    text-decoration: underline
</style>
