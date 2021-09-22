<template>
  <v-navigation-drawer v-model="isOpen" position="right" disable-resize-watcher>
    <v-list nav>
      <template v-for="{ state, items } in agendaStates" :key="state.state">
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
              {{ getProposalCount(ai) }} {{ t('proposal.proposals') }}
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'

import { toggleNavDrawerEvent } from '@/utils'
import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import { AgendaItem } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'
import usePlenary from './usePlenary'
import useProposals from '@/composables/meeting/useProposals'

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

    // TODO: Optimise?
    function getProposalCount (ai: AgendaItem) {
      const filtered = getAgendaProposals(ai.pk, filterProposalStates).length
      const total = getAgendaProposals(ai.pk).length
      return `${filtered}/${total}`
    }

    onMounted(() => {
      toggleNavDrawerEvent.on(toggle)
    })
    onBeforeUnmount(() => {
      toggleNavDrawerEvent.off(toggle)
    })

    return {
      t,
      agendaStates,
      isOpen,
      getProposalCount,
      getURL
    }
  }
})
</script>
