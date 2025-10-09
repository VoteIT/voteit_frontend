<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import useAlert from '@/composables/useAlert'

import usePermission from '@/composables/usePermission'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals from '../proposals/useProposals'
import { ProposalState } from '../proposals/types'
import ProposalCard from '../proposals/ProposalCard.vue'

import { Conditional, PollBaseSettings, PollCriteria } from './methods/types'
import type { PollStartData, PollMethodSettings } from './methods/types'
import { translateCriteria } from './methods/utils'
import type { Poll } from './types'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'
import { PollPlugin, pollPlugins } from './registry'
import StartPollForm from './StartPollForm.vue'
import { AgendaState } from '../agendas/types'

const { t } = useI18n()
const router = useRouter()
const proposals = useProposals()
const { isModerator, meetingRoute, meetingId, getMeetingRoute } = useMeeting()
const { agendaId, agenda } = useAgenda(meetingId)
const { agendaItem, nextPollTitle } = useAgendaItem(agendaId)
const { alert } = useAlert()

usePermission(isModerator, { to: meetingRoute }) // TODO canAddPoll might be different in the future

useMeetingTitle(t('poll.start'))

const selectedProposalIds = ref<number[]>([])
function getPublishedProposals(agendaItem: number) {
  return proposals.getAgendaProposals(
    agendaItem,
    (p) => p.state === ProposalState.Published
  )
}
const pollableAgendaItems = computed(() => {
  return agenda.value
    .filter((ai) => canAddPoll(ai) && getPublishedProposals(ai.pk).length)
    .map((ai) => ({
      ai,
      to: getMeetingRoute('pollStartAI', { aid: ai.pk }),
      subtitle: t(
        'proposal.proposalCount',
        getPublishedProposals(ai.pk).length
      ),
      title: ai.title
    }))
})
const availableProposals = computed(() => getPublishedProposals(agendaId.value))
const selectedProposals = computed(() =>
  availableProposals.value.filter((p) =>
    selectedProposalIds.value.includes(p.pk)
  )
)

function toggleAll() {
  if (selectedProposals.value.length === availableProposals.value.length) {
    selectedProposalIds.value.length = 0
  } else {
    selectedProposalIds.value = availableProposals.value.map((p) => p.pk)
  }
}

const pickMethod = ref(false)

function getCriterionProps(value: boolean | typeof Conditional) {
  if (value === Conditional) return { icon: 'mdi-help-circle' }
  if (value) return { color: 'success', icon: 'mdi-check-circle' }
  return { color: 'warning', icon: 'mdi-close-circle' }
}

function annotateCriterion(criterion: PollPlugin['criterion']) {
  return Object.entries(criterion).map(([criteria, value]) => {
    return {
      criteria,
      value,
      ...translateCriteria(criteria as PollCriteria, t),
      ...getCriterionProps(value)
    }
  })
}
const availableMethods = computed(() =>
  pollPlugins
    .getAvailableMethods(selectedProposals.value.length)
    .map((m) => ({ ...m, criterion: annotateCriterion(m.criterion) }))
)

const methodSelected = ref<Poll['method_name'] | null>(null)
const methodSelectedPlugin = computed(() =>
  pollPlugins.getPlugin(methodSelected.value || '')
)
const methodSettings = ref<
  PollBaseSettings | (PollBaseSettings & PollMethodSettings)
>({ title: '', p_ord: 'c', withheld_result: false })
watch(methodSelected, (name) => {
  if (!name) return
  const initial =
    methodSelectedPlugin.value?.getDefaultSettings?.(
      selectedProposals.value.length
    ) || {}
  methodSettings.value = {
    ...initial,
    title: nextPollTitle.value,
    p_ord: 'c',
    withheld_result: false
  }
})

async function createPoll(
  poll: Pick<PollStartData, 'p_ord' | 'settings' | 'title' | 'withheld_result'>,
  start = false
) {
  if (!methodSelected.value) return
  if (!pollPlugins.getPlugin(methodSelected.value))
    return alert(`*${methodSelected.value} not implemented`)
  const pollData: PollStartData = {
    ...poll,
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    proposals: [...selectedProposalIds.value],
    method_name: methodSelected.value,
    start
  }
  const { data } = await pollType.api.add(pollData)
  router.push(
    getMeetingRoute('poll', { pid: data.pk, pslug: slugify(data.title) })
  )
}

watch(agendaId, () => {
  pickMethod.value = false
  selectedProposalIds.value.length = 0
})
</script>

<template>
  <v-row id="start-poll">
    <v-col lg="8" offset-lg="2">
      <header class="mb-4">
        <h1>{{ $t('poll.start') }}</h1>
      </header>
      <h2 class="mb-2">
        {{ $t('step', 1) }}: {{ $t('poll.selectAgendaItem') }}
      </h2>
      <v-alert
        class="mt-4"
        v-if="!pollableAgendaItems.length"
        type="info"
        :text="$t('poll.noPollableAgendaItems')"
      />
      <v-list bg-color="transparent">
        <v-list-item
          v-show="!agendaId || agendaId === ai.pk"
          v-for="{ ai, ...bind } in pollableAgendaItems"
          :key="ai.pk"
          v-bind="bind"
        >
          <template #append v-if="agendaId === ai.pk">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-close"
              :to="getMeetingRoute('pollStart')"
            />
          </template>
        </v-list-item>
      </v-list>
      <template v-if="agendaId">
        <div class="d-flex my-2">
          <h2 class="flex-grow-1">
            {{ $t('step', 2) }}: {{ $t('poll.pickProposals') }}
          </h2>
          <v-fade-transition>
            <v-btn
              v-if="pickMethod"
              prepend-icon="mdi-undo-variant"
              size="small"
              :text="$t('poll.pickProposals')"
              variant="tonal"
              @click="pickMethod = false"
            />
          </v-fade-transition>
        </div>
        <v-item-group
          class="d-flex flex-column ga-3 mb-4"
          v-model="selectedProposalIds"
          multiple
        >
          <v-item
            v-for="p in availableProposals"
            :key="p.pk"
            :value="p.pk"
            v-slot="{ toggle, isSelected }"
          >
            <v-expand-transition>
              <ProposalCard
                v-show="!pickMethod || selectedProposalIds.includes(p.pk)"
                read-only
                :p="p"
                @click="!pickMethod && toggle?.()"
                :class="{
                  isSelected,
                  'cursor-pointer': !pickMethod,
                  'cursor-not-allowed': pickMethod
                }"
              >
                <template #actions>
                  <v-fade-transition>
                    <v-icon
                      v-if="isSelected"
                      class="check-icon mt-n4 mr-n4"
                      :color="pickMethod ? 'secondary' : 'success'"
                      icon="mdi-check-circle"
                      size="xx-large"
                    />
                  </v-fade-transition>
                </template>
              </ProposalCard>
            </v-expand-transition>
          </v-item>
        </v-item-group>
        <p v-if="!availableProposals.length">
          <em>{{ $t('poll.noAiPublishedProposals') }}</em>
        </p>
        <div v-if="!pickMethod" class="btn-group mt-3">
          <v-btn
            color="primary"
            prepend-icon="mdi-check-all"
            :text="$t('all')"
            variant="flat"
            @click="toggleAll"
          />
          <v-btn
            color="primary"
            :disabled="!selectedProposals.length"
            prepend-icon="mdi-arrow-right-bold"
            :text="$t('navigation.continue')"
            variant="flat"
            @click="pickMethod = true"
          />
        </div>
      </template>
      <template v-if="pickMethod">
        <h2 class="my-2">{{ $t('step', 3) }}: {{ $t('poll.chooseMethod') }}</h2>
        <v-expansion-panels v-model="methodSelected">
          <v-expansion-panel
            v-for="{ criterion, ...method } in availableMethods"
            :key="method.id"
            :title="method.getName(t)"
            :value="method.id"
          >
            <template #text>
              <v-alert
                class="my-4"
                type="info"
                :icon="method.discouraged && 'mdi-alert-decagram'"
              >
                {{ method.getDescription(t) }}
              </v-alert>
              <h3 class="my-2">Valkriterier</h3>
              <v-tooltip
                v-for="{
                  criteria,
                  color,
                  description,
                  icon,
                  title
                } in criterion"
                :key="criteria"
                location="top"
              >
                <template #activator="{ props }">
                  <v-chip class="ma-1" :color="color" v-bind="props">
                    <v-icon start :icon="icon" />
                    {{ title }}
                  </v-chip>
                </template>
                <div style="max-width: 200px">
                  {{ description }}
                </div>
              </v-tooltip>
              <h3 class="my-2">
                {{ $t('options') }}
              </h3>
              <StartPollForm
                :allow-start="agendaItem?.state === AgendaState.Ongoing"
                :create-handler="createPoll"
                :poll-method="method"
                :proposals="selectedProposals.length"
                :title="nextPollTitle"
              />
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
      <v-alert
        v-if="agendaItem && agendaItem.state !== AgendaState.Ongoing"
        class="mt-2"
        :text="$t('poll.cantStartWithoutOngoing')"
        type="info"
      />
    </v-col>
  </v-row>
</template>

<style lang="sass" scoped>
:deep(.proposal)
  opacity: .6

.isSelected :deep(.proposal)
  opacity: 1
  border-color: rgb(var(--v-theme-success))

.check-icon
  transition: 250ms
</style>
