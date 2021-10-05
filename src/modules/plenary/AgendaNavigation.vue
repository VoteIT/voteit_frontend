<template>
  <v-navigation-drawer v-model="isOpen" position="right" disable-resize-watcher>
    <v-list nav>
      <template v-for="{ state, items } in annotatedAgendaStates" :key="state.state">
        <v-list-subheader v-if="items.length">
          {{ t(`workflowState.${state.state}`) }}
        </v-list-subheader>
        <v-list-item v-for="ai in items" :key="ai.pk" :to="getURL(ai)">
          <!-- TODO: Support for v-list-item-content coming? -->
          <div style="width: 100%">
            <v-list-item-title>
              {{ ai.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ t('proposal.proposalCountOfTotal', ai.proposals, ai.proposals.total) }}
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'

import { toggleNavDrawerEvent } from '@/utils'
import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import { AgendaItem } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'
import usePlenary from './usePlenary'
import useProposals from '@/modules/proposals/useProposals'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { agendaStates } = useAgenda()
    const { meetingId } = useMeeting()
    const { filterProposalStates } = usePlenary()
    const { getAgendaProposals } = useProposals()
    const isOpen = ref(false)

    function toggle () {
        isOpen.value = !isOpen.value
    }

    function getURL (ai: AgendaItem) {
      return `/p/${meetingId.value}/${ai.pk}`
    }

    const annotatedAgendaStates = computed(() => {
      return agendaStates.value.map(({ state, items }) => {
        return {
          state,
          items: items.map(ai => ({
            ...ai,
            proposals: {
              filtered: getAgendaProposals(ai.pk, filterProposalStates).length,
              total: getAgendaProposals(ai.pk).length
            }
          }))
        }
      })
    })

    onMounted(() => {
      toggleNavDrawerEvent.on(toggle)
    })
    onBeforeUnmount(() => {
      toggleNavDrawerEvent.off(toggle)
    })

    return {
      t,
      isOpen,
      annotatedAgendaStates,
      getURL
    }
  }
})
</script>
