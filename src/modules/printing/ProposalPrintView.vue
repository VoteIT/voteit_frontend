<template>
  <v-row>
    <v-col v-bind="cols.default">
      <v-sheet class="d-print-none pa-4 mb-8" border rounded>
        <div class="d-flex">
          <h2>
            {{ t('printing.selectProposals') }}
          </h2>
          <v-fade-transition>
            <v-btn
              v-show="!allSelected"
              color="primary"
              prepend-icon="mdi-check-all"
              class="mx-4"
              size="small"
              @click="allSelected = true"
            >
              {{ t('printing.selectAll') }}
            </v-btn>
          </v-fade-transition>
          <v-spacer />
          <v-btn
            color="primary"
            icon="mdi-printer"
            :disabled="!selectedProposals.length"
            @click="print()"
          />
        </div>
        <v-chip-group v-model="propIds" multiple column>
          <v-chip v-for="{ pk, prop_id } in proposals" :key="pk" :value="pk" color="primary">
            #{{ prop_id }}
          </v-chip>
        </v-chip-group>
      </v-sheet>
      <v-alert type="info" class="my-8 d-print-none" :text="t('printing.proposalHelpText')" />
      <div v-for="{ pk, author, meetingGroup, body, body_diff_brief, created, prop_id } in selectedProposals" :key="pk" class="proposal-container mb-12">
        <p class="mb-2 text-h4">
          #{{ prop_id }}
        </p>
        <p class="text-secondary">
          <span v-if="meetingGroup">
            {{ meetingGroup.title }}
          </span>
          <User v-else :pk="author" userid />
          - {{ DateTime.fromISO(created).toLocaleString(DateTime.DATETIME_SHORT) }}
        </p>
        <div v-html="body_diff_brief || body" class="text-h4 proposal-text-paragraph my-2" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { DateTime } from 'luxon'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import useDefaults from '@/composables/useDefaults'

import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useMeetingTitle from '../meetings/useMeetingTitle'
import { ProposalState } from '../proposals/types'
import useProposals from '../proposals/useProposals'

import usePrinting from './usePrinting'

const { t } = useI18n()
useMeetingTitle('Printing') // TODO
const { cols } = useDefaults()
const { meetingId } = useMeeting()
const { getMeetingGroup } = useMeetingGroups(meetingId)
const agendaId = computed(() => Number(route.params.aid))
const { getAgendaProposals } = useProposals()
const route = useRoute()
const router = useRouter()
const propIds = computed<number[]>({
  get () {
    if (typeof route.params.propIds !== 'string') return []
    return route.params.propIds
      .split(',')
      .map(Number)
  },
  set (value) {
    router.replace(value.join(','))
  }
})
const proposals = computed(() => getAgendaProposals(agendaId.value, p => p.state !== ProposalState.Retracted))
const selectedProposals = computed(() => {
  return getAgendaProposals(
    agendaId.value,
    ({ pk }) => propIds.value.includes(pk)
  ).map(p => ({
    meetingGroup: p.meeting_group && getMeetingGroup(p.meeting_group),
    ...p
  }))
})

const allSelected = computed({
  get () {
    return propIds.value.length === proposals.value.length
  },
  set (value) {
    if (value) propIds.value = proposals.value.map(p => p.pk)
  }
})

function print () {
  if (selectedProposals.value.length) window.print()
}
function backAfterPrint () {
  if (!backOnPrinted.value) return
  backOnPrinted.value = false
  nextTick(router.back)
}

const { backOnPrinted } = usePrinting()
onBeforeMount(() => window.addEventListener('afterprint', backAfterPrint))
onBeforeUnmount(() => window.removeEventListener('afterprint', backAfterPrint))
onMounted(print)
</script>

<style lang="sass" scoped>
.proposal-container
  break-after: page
  &:last-child
    break-after: unset
</style>
