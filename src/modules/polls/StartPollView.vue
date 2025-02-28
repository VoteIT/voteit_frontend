<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isEmpty } from 'lodash'

import { slugify } from '@/utils'
import { required, maxLength } from '@/utils/rules'

import useAlert from '@/composables/useAlert'

import SchemaForm from '@/components/SchemaForm.vue'
import usePermission from '@/composables/usePermission'
import { FieldType, FormSchema } from '@/components/types'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals from '../proposals/useProposals'
import useProposalOrdering from '../proposals/useProposalOrdering'
import { ProposalState } from '../proposals/types'
import ProposalCard from '../proposals/ProposalCard.vue'

import { Conditional, PollBaseSettings, PollCriteria } from './methods/types'
import type { PollStartData, PollMethodSettings } from './methods/types'
import { translateCriteria } from './methods/utils'
import type { Poll } from './types'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'
import { PollPlugin, pollPlugins } from './registry'

const { t } = useI18n()
const router = useRouter()
const proposals = useProposals()
const { isModerator, meetingRoute, meetingId, getMeetingRoute } = useMeeting()
const { agendaId, agenda } = useAgenda(meetingId)
const { agendaItem, nextPollTitle } = useAgendaItem(agendaId)
const { alert } = useAlert()
const { proposalOrderingOptions } = useProposalOrdering(t)

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
  const initial = methodSelectedPlugin.value?.initialSettings || {}
  methodSettings.value = {
    ...initial,
    title: nextPollTitle.value,
    p_ord: 'c',
    withheld_result: false
  }
})

const working = ref(false)
const settingsValid = ref(false)
const readyToCreate = computed(() => {
  return methodSelected.value && !working.value && settingsValid.value
})

function settingsOrNull(
  settings: PollMethodSettings | {}
): PollMethodSettings | null {
  if (isEmpty(settings)) return null
  return settings as PollMethodSettings
}

async function createPoll(start = false) {
  if (!methodSelected.value) return
  if (!pollPlugins.getPlugin(methodSelected.value))
    return alert(`*${methodSelected.value} not implemented`)

  working.value = true
  const { title, p_ord, withheld_result, ...settings } = methodSettings.value
  // For Repeated Schulze
  if (
    'winners' in settings &&
    settings.winners === selectedProposals.value.length
  )
    settings.winners = null
  const pollData: PollStartData = {
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    title,
    p_ord,
    proposals: [...selectedProposalIds.value],
    method_name: methodSelected.value,
    start,
    settings: settingsOrNull(settings),
    withheld_result
  }
  try {
    const { data } = await pollType.api.add(pollData as Partial<Poll>)
    router.push(
      getMeetingRoute('poll', { pid: data.pk, pslug: slugify(data.title) })
    )
  } catch {}
  working.value = false
}

const methodSchema = computed<FormSchema | undefined>(() => {
  if (!methodSelected.value) return
  const specifics =
    methodSelectedPlugin.value?.getSchema?.(
      t,
      selectedProposals.value.length
    ) || []
  return [
    {
      type: FieldType.Text,
      name: 'title',
      rules: [required, maxLength(70)],
      label: t('title')
    },
    {
      type: FieldType.Select,
      name: 'p_ord',
      rules: [required],
      label: t('proposal.ordering'),
      items: proposalOrderingOptions.value
    },
    ...specifics,
    {
      type: FieldType.Checkbox,
      name: 'withheld_result',
      label: t('poll.result.withhold')
    }
  ]
})

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
        <h2 class="my-2">
          {{ $t('step', 2) }}: {{ $t('poll.pickProposals') }}
        </h2>
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
            v-for="{
              id,
              criterion,
              discouraged,
              getName,
              getDescription
            } in availableMethods"
            :key="id"
            :title="getName(t)"
            :value="id"
          >
            <v-expansion-panel-text>
              <v-alert
                class="my-4"
                type="info"
                :icon="discouraged && 'mdi-alert-decagram'"
              >
                {{ getDescription(t) }}
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
              <SchemaForm
                v-if="methodSchema"
                :key="`options-${id}`"
                :schema="methodSchema"
                v-model="methodSettings"
                @update:valid="settingsValid = $event"
                validate-immediately
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <div class="btn-group mt-3">
          <v-btn
            color="primary"
            prepend-icon="mdi-undo-variant"
            :text="$t('navigation.back')"
            variant="flat"
            @click="pickMethod = false"
          />
          <v-btn
            color="primary"
            :disabled="!readyToCreate"
            prepend-icon="mdi-check"
            :text="$t('create')"
            variant="flat"
            @click="createPoll()"
          />
          <v-btn
            v-if="agendaItem?.state === 'ongoing'"
            color="primary"
            :disabled="!readyToCreate"
            prepend-icon="mdi-play"
            :text="$t('poll.createAndStart')"
            variant="flat"
            @click="createPoll(true)"
          />
        </div>
      </template>
      <v-alert
        v-if="agendaItem && agendaItem.state !== 'ongoing'"
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
