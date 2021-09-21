<template>
  <v-row>
    <v-col cols="7" md="8" lg="9">
      <Widget v-for="p in selected" :key="p.pk">
        <Proposal readOnly :p="p">
          <template v-slot:top>
            <div class="text-right">
              <!-- <v-btn icon="mdi-check" variant="outlined" color="success" />
              <v-btn icon="mdi-close" color="warning" />
              <v-btn icon="mdi-text-box" variant="outlined" color="primary" /> -->
              <v-btn icon="mdi-chevron-right" variant="text" @click="toggle(p)" />
            </div>
          </template>
        </Proposal>
      </Widget>
    </v-col>
    <v-col cols="5" md="4" lg="3">
      <Proposal v-for="p in pool" :key="p.pk" readOnly :p="p" class="mb-6">
        <template v-slot:top>
          <v-btn size="small" icon="mdi-chevron-left" variant="text" @click="toggle(p)" />
        </template>
      </Proposal>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, provide, reactive, ref, watch } from 'vue'

import ProposalVue from '@/components/widgets/Proposal.vue'

import useMeetingChannel from '@/modules/meetings/useMeetingChannel'
import useProposals from '@/composables/meeting/useProposals'
import useAgendaItem from '../agendas/useAgendaItem'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { LastReadKey } from '@/composables/useUnread'
import { Proposal } from '@/contentTypes/types'

export default defineComponent({
  components: {
    Proposal: ProposalVue
  },
  setup () {
    const { agendaItem } = useAgendaItem()
    const { getAgendaProposals } = useProposals()

    useMeetingChannel(true)

    const proposalStates = ref([ProposalState.Published])
    const selectedProposalIds = reactive<number[]>([])
    watch(agendaItem, () => {
      selectedProposalIds.length = 0
    })

    const proposals = computed(() => {
      if (!agendaItem.value) return []
      return getAgendaProposals(
        agendaItem.value.pk,
        p => proposalStates.value.includes(p.state)
      )
    })

    const selected = computed(() => selectedProposalIds.map(pk => proposals.value.find(p => p.pk === pk)).filter(Boolean))
    const pool = computed(() => proposals.value.filter(p => !selectedProposalIds.includes(p.pk)))

    provide(LastReadKey, ref(new Date()))

    function toggle (p: Proposal) {
      const index = selectedProposalIds.indexOf(p.pk)
      if (index === -1) selectedProposalIds.push(p.pk)
      else selectedProposalIds.splice(index, 1)
    }

    return {
      agendaItem,
      selected,
      pool,
      selectedProposalIds,
      toggle
    }
  }
})
</script>
