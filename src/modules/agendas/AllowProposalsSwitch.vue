<script setup lang="ts">
import { shallowRef } from 'vue'

import { minTime } from '@/utils'
import useErrorHandler from '@/composables/useErrorHandler'

import { agendaItemType } from './contentTypes'
import useAgendaItem from './useAgendaItem'

const { agendaId, agendaItem, canChangeAgendaItem } = useAgendaItem()
const { handled } = useErrorHandler({ target: 'dialog' })

const saving = shallowRef(false)
async function setProposalsAllowed(value: boolean | null) {
  saving.value = true
  await handled(
    () =>
      minTime(
        agendaItemType.api.patch(agendaId.value, { block_proposals: !value })
      ),
    'block_proposals'
  )
  saving.value = false
}
</script>

<template>
  <v-switch
    v-if="canChangeAgendaItem"
    :disabled="saving"
    :label="$t('agenda.allowProposals')"
    :model-value="!agendaItem?.block_proposals"
    hide-details
    @update:model-value="setProposalsAllowed($event)"
  />
</template>
