<template>
  <v-row id="start-poll">
    <v-col lg="8" offset-lg="2">
      <header class="mb-4">
        <h1>{{ t('poll.start') }}</h1>
      </header>
      <h2 class="mb-2">
        {{ t('step', 1) }}: {{ t('poll.selectAgendaItem') }}
      </h2>
      <v-alert class="mt-4" v-if="!pollableAgendaItems.length" type="info" :text="t('poll.noPollableAgendaItems')" />
      <v-list bg-color="background">
        <v-list-item v-show="!agendaId || agendaId === ai.pk" v-for="{ ai, ...bind } in pollableAgendaItems" :key="ai.pk" v-bind="bind">
          <template #append v-if="agendaId">
            <v-btn size="small" variant="text" icon="mdi-close" :to="`${meetingPath}/polls/new`"/>
          </template>
        </v-list-item>
      </v-list>
      <template v-if="agendaId">
        <h2 class="my-2">{{ t('step', 2) }}: {{ t('poll.pickProposals') }}</h2>
        <v-item-group v-model="selectedProposalIds" multiple>
          <v-item v-for="p in availableProposals" :key="p.pk" :value="p.pk" v-slot="{ toggle, isSelected }">
            <v-expand-transition>
              <Proposal v-show="!pickMethod || selectedProposalIds.includes(p.pk)" read-only :p="p" @click="!pickMethod && toggle()" :class="{ isSelected, locked: pickMethod }" class="mb-4" />
            </v-expand-transition>
          </v-item>
        </v-item-group>
        <p v-if="!availableProposals.length"><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
        <div v-if="!pickMethod" class="btn-group mt-3">
          <v-btn prepend-icon="mdi-check-all" color="primary" @click="toggleAll">
            {{ t('all') }}
          </v-btn>
          <v-btn prepend-icon="mdi-arrow-right-bold" color="primary" :disabled="!selectedProposals.length" @click="pickMethod=true">
            {{ t('continue') }}
          </v-btn>
        </div>
      </template>
      <template v-if="pickMethod">
        <h2 class="my-2">{{ t('step', 3) }}: {{ t('poll.chooseMethod') }}</h2>
        <v-expansion-panels v-model="methodSelected">
          <v-expansion-panel v-for="{ id, criterion, discouraged } in availableMethods" :key="id" :title="t(`poll.method.${id}`)" :value="id">
            <v-expansion-panel-text>
              <v-alert v-if="methodSelected && t(`poll.method.description.${methodSelected}`).length" class="my-4" type="info" :icon="discouraged && 'mdi-alert-decagram'">
                {{ t(`poll.method.description.${methodSelected}`) }}
              </v-alert>
              <h3 class="my-2">
                Valkriterier
              </h3>
              <v-tooltip v-for="[criteria, value] of Object.entries(criterion)" :key="criteria" location="top">
                <template #activator="{ props }">
                  <v-chip v-if="value === Conditional" class="ma-1" v-bind="props">
                    <v-icon start>mdi-help-circle</v-icon>
                    {{ t(`poll.criterion.${criteria}.title`) }}
                  </v-chip>
                  <v-chip v-else-if="value" color="success" class="ma-1" v-bind="props">
                    <v-icon start>mdi-check-circle</v-icon>
                    {{ t(`poll.criterion.${criteria}.title`) }}
                  </v-chip>
                  <v-chip v-else color="warning" class="ma-1" v-bind="props">
                    <v-icon start>mdi-close-circle</v-icon>
                    {{ t(`poll.criterion.${criteria}.title`) }}
                  </v-chip>
                </template>
                <div style="max-width: 200px;">
                  {{ t(`poll.criterion.${criteria}.description`) }}
                </div>
              </v-tooltip>
              <h3 class="my-2">
                {{ t('options') }}
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
          <v-btn prepend-icon="mdi-undo-variant" @click="pickMethod=false" color="primary">{{ t('back') }}</v-btn>
          <v-btn prepend-icon="mdi-check" color="primary" :disabled="!readyToCreate" @click="createPoll()">{{ t('create') }}</v-btn>
          <v-btn v-if="agendaItem?.state === 'ongoing'" prepend-icon="mdi-play" color="primary" :disabled="!readyToCreate" @click="createPoll(true)">{{ t('poll.createAndStart') }}</v-btn>
        </div>
      </template>
      <v-alert v-if="agendaItem && agendaItem.state !== 'ongoing'" type="info" class="mt-2">
        {{ t('poll.cantStartWithoutOngoing') }}
      </v-alert>
    </v-col>
  </v-row>
</template>

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
import { ProposalState } from '../proposals/types'

import { Conditional, PollStartData, PollMethodSettings, Poll } from './methods/types'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'
import { pollPlugins } from './registry'

const { t } = useI18n()
const router = useRouter()
const proposals = useProposals()
const { isModerator, meetingPath, meetingId } = useMeeting()
const { agendaId, agenda } = useAgenda(meetingId)
const { agendaItem, nextPollTitle } = useAgendaItem(agendaId)
const { alert } = useAlert()

usePermission(isModerator, { to: meetingPath }) // TODO canAddPoll might be different in the future

useMeetingTitle(t('poll.start'))

const selectedProposalIds = ref<number[]>([])
function getPublishedProposals (agendaItem: number) {
  return proposals.getAgendaProposals(agendaItem, p => p.state === ProposalState.Published)
}
const pollableAgendaItems = computed(() => {
  return agenda.value
    .filter(ai => canAddPoll(ai) && getPublishedProposals(ai.pk).length)
    .map(ai => ({
      ai,
      to: `${meetingPath.value}/polls/new/${ai.pk}`,
      title: `${ai.title} (${getPublishedProposals(ai.pk).length || '-'})`
    }))
})
const availableProposals = computed(() => getPublishedProposals(agendaId.value))
const selectedProposals = computed(() => availableProposals.value.filter(p => selectedProposalIds.value.includes(p.pk)))

function toggleAll () {
  if (selectedProposals.value.length === availableProposals.value.length) {
    selectedProposalIds.value.length = 0
  } else {
    selectedProposalIds.value = availableProposals.value.map(p => p.pk)
  }
}

const pickMethod = ref(false)
const availableMethods = computed(() => pollPlugins.getAvailableMethods(selectedProposals.value.length))

const methodSelected = ref<Poll['method_name'] | null>(null)
const methodSelectedPlugin = computed(() => methodSelected.value && pollPlugins.getPlugin(methodSelected.value))
const methodSettings = ref<{ title: string } | { title: string } & PollMethodSettings>({ title: '' })
watch(methodSelected, name => {
  if (!name) return
  const initial = methodSelectedPlugin.value?.initialSettings || {}
  methodSettings.value = {
    ...initial,
    title: nextPollTitle.value
  }
})

const working = ref(false)
const settingsValid = ref(false)
const readyToCreate = computed(() => {
  return methodSelected.value && !working.value && settingsValid.value
})

function settingsOrNull (settings: PollMethodSettings | {}): PollMethodSettings | null {
  if (isEmpty(settings)) return null
  return settings as PollMethodSettings
}

async function createPoll (start = false) {
  if (!methodSelected.value) return
  if (!pollPlugins.getPlugin(methodSelected.value)) return alert(`*${methodSelected.value} not implemented`)

  working.value = true
  const { title, ...settings } = methodSettings.value
  // For Repeated Schulze
  if ('winners' in settings && settings.winners === selectedProposals.value.length) settings.winners = null
  const pollData: PollStartData = {
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    title,
    proposals: [...selectedProposalIds.value],
    method_name: methodSelected.value,
    start,
    settings: settingsOrNull(settings)
  }
  try {
    const { data } = await pollType.api.add(pollData as Partial<Poll>)
    router.push(`${meetingPath.value}/polls/${data.pk}/${slugify(data.title)}`)
  } catch {}
  working.value = false
}

const methodSchema = computed<FormSchema | undefined>(() => {
  if (!methodSelected.value) return
  const specifics = methodSelectedPlugin.value?.getSchema?.(t, selectedProposals.value.length) || []
  return [{
    type: FieldType.Text,
    name: 'title',
    rules: [required, maxLength(70)],
    label: t('title')
  }, ...specifics]
})

watch(agendaId, () => {
  pickMethod.value = false
  selectedProposalIds.value.length = 0
})
</script>

<style lang="sass">
#start-poll
  .method-list > div
    border-top: 1px solid rgb(var(--v-border-color))
    &:last-child
      border-bottom: 1px solid rgb(var(--v-border-color))
    > div
      padding: .5rem 1.5rem
    .number label
      display: block
    a
      display: block
      text-decoration: none
      padding: 6px
      color: rgb(var(--v-theme-on-background))
      &::before
        content: ''
        width: 1.2rem
        display: inline-block
        line-height: 1
    &.isSelected
      background-color: rgb(var(--v-theme-surface))
      a::before
        content: '✔'
      &.locked
        background-color: #ddd
    span
      display: block
      padding: 6px 6px 6px calc(6px + 1.2em)

  .proposal
    opacity: .6

  .isSelected
    .proposal
      opacity: 1
      border-color: rgb(var(--v-theme-success))
      background-color: #fff
      position: relative
      &::after
        content: '✓'
        font-size: 36pt
        position: absolute
        top: -15px
        right: 0
  .locked .proposal
    background-color: rgba(var(--v-theme-secondary), .1)
</style>
