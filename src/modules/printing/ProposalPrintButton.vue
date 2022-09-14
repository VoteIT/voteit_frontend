<template>
  <v-btn size="small" color="primary" :to="to">
    <v-icon icon="mdi-printer" />
  </v-btn>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal } from '../proposals/types'

export default defineComponent({
  props: {
    proposal: {
      type: Object as PropType<Proposal>,
      required: true
    }
  },
  setup (props) {
    const { agendaItemPath } = useAgendaItem(ref(props.proposal.agenda_item))
    const to = computed(() => `${agendaItemPath.value}/print/${props.proposal.pk}`)
    return {
      to
    }
  }
})
</script>
