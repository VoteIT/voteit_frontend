<template>
  <v-card class="my-2" border>
    <v-card-title>
      Proposal text
      <v-btn icon="mdi-pencil" variant="text" disabled />
    </v-card-title>
    <template v-for="p in document.paragraphs" :key="p.pk">
      <v-divider/>
      <v-card-text>
        <Tag :name="p.tag" :count="proposalCount[p.tag]" />
        <p class="mt-2">{{ p.body }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn disabled size="small" prepend-icon="mdi-text-box-plus-outline" color="primary">Propose change</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import { TextDocument } from './contentTypes'
import useProposals from './useProposals'

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
    return {
      t,
      proposalCount
    }
  }
})
</script>
