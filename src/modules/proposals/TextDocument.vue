<template>
  <v-card class="my-2" border>
    <v-card-title>
      <!-- Empty title not really allowed, so no translation needed here -->
      {{ document.title || '-- text document --' }}
      <v-spacer/>
      <v-btn v-if="canChange" icon="mdi-pencil" variant="text" @click="editDocument()" />
      <v-btn v-if="canDelete" icon="mdi-delete" variant="text" color="warning" @click="deleteDocument()" />
    </v-card-title>
    <template v-for="p in document.paragraphs" :key="p.pk">
      <v-divider/>
      <v-card-text>
        <Tag :name="p.tag" :count="proposalCount[p.tag]" />
        <p class="mt-2">{{ p.body }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn disabled size="small" prepend-icon="mdi-text-box-plus-outline" color="primary">{{ t('proposal.change') }}</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>

<script lang="ts">
import { dialogQuery, openModalEvent } from '@/utils'
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { TextDocument, textDocumentType } from './contentTypes'
import useProposals from './useProposals'
import useTextDocument from './useTextDocument'
import EditTextDocumentModal from './EditTextDocumentModal.vue'
import { ThemeColor } from '@/utils/types'

export default defineComponent({
  props: {
    document: {
      type: Object as PropType<TextDocument>,
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
      })) textDocumentType.api.delete(props.document.pk)
    }

    return {
      t,
      proposalCount,
      deleteDocument,
      editDocument,
      ...useTextDocument(ref(props.document))
    }
  }
})
</script>
