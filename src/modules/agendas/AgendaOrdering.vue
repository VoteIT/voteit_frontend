<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

import useMeetingId from '../meetings/useMeetingId'
import { agendaItemType } from './contentTypes'

import useAgenda from './useAgenda'
import { AgendaItem } from './types'
import { meetingType } from '../meetings/contentTypes'
import { sleep } from '@/utils'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const { t } = useI18n()
const meetingId = useMeetingId()
const { agenda, getAgendaItem } = useAgenda(meetingId)
const { getState } = agendaItemType.useWorkflows()

function isAI(ai?: AgendaItem): ai is AgendaItem {
  return !!ai
}

const actualAgendaOrder = computed(() => agenda.value.map((ai) => ai.pk))
const agendaItemOrder = ref(actualAgendaOrder.value)
const agendaOrderChanged = computed(
  () => !isEqual(agendaItemOrder.value, actualAgendaOrder.value)
)
const agendaItems = computed({
  get: () => agendaItemOrder.value.map(getAgendaItem).filter(isAI),
  set: (agendaItems) => {
    agendaItemOrder.value = agendaItems.map((ai) => ai.pk)
  }
})

const orderSaving = ref(false)
async function saveAgendaOrder() {
  orderSaving.value = true
  try {
    await meetingType.api.action(meetingId.value, 'set_agenda_order', {
      order: agendaItemOrder.value
    })
    await sleep(500)
    emit('saved')
  } catch {
    alert("^Couldn't save agenda order")
  }
  orderSaving.value = false
}

/**
 * Watch for changes in agenda
 */
watch(agenda, (agendaItems) => {
  for (const ai of agendaItems) {
    if (!agendaItemOrder.value.includes(ai.pk))
      agendaItemOrder.value = [...agendaItemOrder.value, ai.pk]
  }
})
</script>

<template>
  <div>
    <Draggable v-model="agendaItems" item-key="pk">
      <template #item="{ element }">
        <div>
          <v-icon size="small" :icon="getState(element.state)?.icon" />
          <span>{{ element.title }}</span>
          <v-icon size="small" icon="mdi-drag-horizontal" />
        </div>
      </template>
    </Draggable>
    <div class="text-right">
      <v-btn
        class="my-1"
        color="primary"
        :disabled="!agendaOrderChanged"
        :loading="orderSaving"
        @click="saveAgendaOrder"
      >
        {{ t('save') }}
      </v-btn>
    </div>
  </div>
</template>

<style lang="sass" scoped>
[data-draggable]
  padding: .5em
  margin-bottom: .3em
  border: 1px solid #ddd
  border-radius: 3px
  display: flex
  cursor: grab
  span
    flex-grow: 1
    padding: 0 .8em
  .material-icons
    color: #999

.sortable-chosen
  background-color: #eee

.sortable-ghost
  opacity: .5
</style>
