<template>
  <v-card class="my-2 proposal-text" border>
    <v-card-title>
      <!-- Empty title not really allowed, so no translation needed here -->
      {{ document.title || '-- text document --' }}
      <v-spacer/>
      <v-btn v-if="canChangeDocument" icon="mdi-pencil" variant="text" @click="editDocument()" />
      <v-btn v-if="canDeleteDocument" icon="mdi-delete" variant="text" color="warning" @click="deleteDocument()" />
      <v-btn variant="text" icon="mdi-chevron-up" :class="{ collapsed }" @click="collapsed = !collapsed" />
    </v-card-title>
    <v-expand-transition>
      <div v-show="!collapsed">
        <template v-for="p in document.paragraphs" :key="p.pk">
          <v-divider/>
          <v-card-text>
            <Tag :name="p.tag" :count="proposalCount[p.tag]" />
            <p class="mt-2 proposal-text-paragraph">{{ p.body }}</p>
          </v-card-text>
          <v-card-actions v-if="canAddProposal">
            <AddTextProposalModal :paragraph="p" />
          </v-card-actions>
        </template>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { openModalEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import { ProposalText, proposalTextType } from './contentTypes'
import useProposals from './useProposals'
import useTextDocument from './useTextDocument'
import EditTextDocumentModal from './EditProposalTextModal.vue'
import AddTextProposalModal from './AddTextProposalModal.vue'

export default defineComponent({
  props: {
    document: {
      type: Object as PropType<ProposalText>,
      required: true
    }
  },
  components: {
    AddTextProposalModal
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

    // function addProposal (data: TextParagraph) {
    //   openModalEvent.emit({
    //     title: t('proposal.change'),
    //     component: AddTextProposalModal,
    //     data
    //   })
    // }

    const collapsed = ref(false)

    return {
      t,
      collapsed,
      proposalCount,
      // addProposal,
      deleteDocument,
      editDocument,
      ...useTextDocument(ref(props.document))
    }
  }
})
</script>

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
    color: rgb(var(--v-theme-success-darken-2))
    font-weight: 700
    text-decoration: underline
</style>
