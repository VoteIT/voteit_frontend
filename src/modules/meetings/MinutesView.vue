<template>
  <div>
    <h1>
      Ehlo minutes
    </h1>
    <v-sheet border rounded class="pa-4">
      Filter
      <v-switch label="Show approved proposals" disabled v-model="showStates.approved" color="primary" hide-details />
      <v-switch label="Show denied proposals" v-model="showStates.denied" color="primary" hide-details />
      <v-switch label="Show unresolved proposals" v-model="showStates.unresolved" color="primary" hide-details />
    </v-sheet>
    <div v-for="{ hasUnresolved, pk, proposalStates, title } in annotatedAgenda" :key="pk">
      <div class="mt-8 mb-2 d-flex align-center">
        <h2 class="flex-grow-0">
          {{ title }}
        </h2>
        <v-tooltip v-if="hasUnresolved" location="bottom">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="warning" size="large" class="ml-2">
              mdi-alert
            </v-icon>
          </template>
          This agenda item has unresolved proposals
        </v-tooltip>
      </div>
      <!-- <v-alert v-if="hasUnresolved" type="warning" class="my-2">
        This agenda item has unresolved proposals (published or in voting).
      </v-alert> -->
      <p v-if="!proposalStates.length"><em>
        Nothing to report
      </em></p>
      <div v-for="{ proposals, state, title } in proposalStates" :key="state">
        <h3>
          {{ title }}
        </h3>
        <Proposal v-for="p in proposals" :key="p.pk" :p="p" class="my-2" read-only />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, reactive } from 'vue'

import useAgenda from '../agendas/useAgenda'
import { ProposalState } from '../proposals/types'
import useProposals from '../proposals/useProposals'

import { meetingIdKey } from './injectionKeys'

type MinuteProposalState = 'approved' | 'denied' | 'unresolved'

const PROPOSAL_STATES: { state: MinuteProposalState, states: ProposalState[], title: string }[] = [
  {
    state: 'approved',
    states: [ProposalState.Approved],
    title: 'Approved proposals'
  },
  {
    state: 'denied',
    states: [ProposalState.Denied],
    title: 'Denied proposals'
  },
  {
    state: 'unresolved',
    states: [ProposalState.Published, ProposalState.Voting],
    title: 'Unresolved proposals'
  }
]

export default defineComponent({
  setup () {
    const meetingId = inject(meetingIdKey)
    if (!meetingId) throw new Error('Minutes.vue requires Meeting context')
    const { agenda } = useAgenda(meetingId)
    const { getAgendaProposals } = useProposals()
    const showStates = reactive({
      approved: true,
      denied: false,
      unresolved: false
    })

    const annotatedAgenda = computed(() => {
      return agenda.value.map(({ pk, title }) => {
        const proposalStates = PROPOSAL_STATES
          .map(({ state, states, title }) => ({ state, title, proposals: getAgendaProposals(pk, p => states.includes(p.state)) }))
        return {
          hasUnresolved: proposalStates.find(({ state, proposals }) => state === 'unresolved' && proposals.length),
          pk,
          proposalStates: proposalStates.filter(({ state, proposals }) => showStates[state] && proposals.length),
          title
        }
      })
    })

    return {
      annotatedAgenda,
      showStates
    }
  }
})
</script>
