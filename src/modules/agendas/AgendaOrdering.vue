<script setup lang="ts">
import { isEqual } from 'lodash'
import { useSortable } from '@vueuse/integrations/useSortable'
import { ComponentPublicInstance, computed, ref, watch } from 'vue'

import useMeetingId from '../meetings/useMeetingId'
import { agendaItemType } from './contentTypes'

import useAgenda from './useAgenda'
import { AgendaItem } from './types'
import { meetingType } from '../meetings/contentTypes'
import { minTime } from '@/utils'
import useAgendaStore from './useAgendaStore'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const { getAgendaItem } = useAgendaStore()
const meetingId = useMeetingId()
const { agenda } = useAgenda(meetingId)

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

const listElement = ref<ComponentPublicInstance | null>(null)
useSortable(listElement, agendaItems)

const orderSaving = ref(false)
async function saveAgendaOrder() {
  orderSaving.value = true
  try {
    await minTime(
      meetingType.api.action('set_agenda_order', meetingId.value, {
        order: agendaItemOrder.value
      })
    )
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
    <v-list class="mb-3" ref="listElement" border density="compact" rounded>
      <v-list-item
        v-for="element in agendaItems"
        :key="element.pk"
        append-icon="mdi-drag-horizontal"
        class="cursor-grab"
        :prepend-icon="agendaItemType.sm.getState(element.state)?.icon"
        :title="element.title"
      />
    </v-list>
    <div class="text-right">
      <v-btn
        color="primary"
        :disabled="!agendaOrderChanged"
        :loading="orderSaving"
        :text="$t('save')"
        @click="saveAgendaOrder"
      />
    </div>
  </div>
</template>

<style lang="sass" scoped>
.sortable-chosen
  background-color: rgb(var(--v-theme-surface-active))

.sortable-ghost
  opacity: .5
</style>
