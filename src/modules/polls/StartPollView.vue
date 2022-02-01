<template>
  <v-row id="start-poll">
    <v-col lg="8" offset-lg="2">
      <header class="mb-4">
        <h1>{{ t('poll.start') }}</h1>
      </header>
      <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
      <v-btn color="secondary" v-if="agendaId && agendaItem" :to="`${meetingPath}/polls/new`" append-icon="mdi-close">
        {{ agendaItem.title }}
      </v-btn>
      <v-list v-else-if="pollableAgendaItems.length">
        <v-list-item v-for="pollable in pollableAgendaItems" :key="pollable.to" v-bind="pollable" />
      </v-list>
      <v-alert class="mt-4" v-else type="info" :text="t('poll.noPollableAgendaItems')" />
      <template v-if="agendaId">
        <h2 class="mt-2">{{ t('step', { step: 2 }) }}: {{ t('poll.pickProposals') }}</h2>
        <v-item-group v-model="selectedProposalIds" multiple>
          <v-item v-for="p in availableProposals" :key="p.pk" :value="p.pk" v-slot="{ toggle, isSelected }">
            <v-expand-transition>
              <Proposal v-show="!pickMethod || selectedProposalIds.includes(p.pk)" read-only :p="p" @click="!pickMethod && toggle()" :class="{ isSelected, locked: pickMethod }" class="mb-4" />
            </v-expand-transition>
          </v-item>
        </v-item-group>
        <p v-if="!availableProposals.length"><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
        <div v-if="!pickMethod" class="btn-group mt-3">
          <Btn icon="mdi-check-all" @click="toggleAll">{{ t('all') }}</Btn>
          <Btn icon="mdi-arrow-right-bold" :disabled="!selectedProposals.length" @click="pickMethod=true">{{ t('continue') }}</Btn>
        </div>
      </template>
      <template v-if="pickMethod">
        <h2 class="mt-2">{{ t('step', { step: 3 }) }}: {{ t('poll.chooseMethod') }}</h2>
        <v-item-group class="method-list" v-model="methodSelected" mandatory>
          <v-item v-for="m in availableMethods" :key="m.name" :value="m" v-slot="{ isSelected, toggle }">
            <div :class="{ isSelected }">
              <a href="#" @click.prevent="toggle()">{{ t(`poll.method.${m.name}`) }}</a>
              <v-expand-transition>
                <div v-if="isSelected">
                  <h3 class="mb-4">
                    {{ t('options') }}
                  </h3>
                  <SchemaForm :schema="methodSchema" v-model="methodSettings" v-model:valid="settingsValid" />
                </div>
              </v-expand-transition>
            </div>
          </v-item>
        </v-item-group>
        <div class="btn-group mt-3">
          <v-btn prepend-icon="mdi-undo-variant" @click="pickMethod=false" color="primary">{{ t('back') }}</v-btn>
          <v-btn prepend-icon="mdi-check" color="primary" :disabled="!readyToCreate" @click="createPoll()">{{ t('create') }}</v-btn>
          <v-btn prepend-icon="mdi-play" color="primary" :disabled="!readyToCreate" @click="createPoll(true)">{{ t('poll.createAndStart') }}</v-btn>
        </div>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isEmpty } from 'lodash'

import { slugify } from '@/utils'

import useAgenda from '@/modules/agendas/useAgenda'
import useAlert from '@/composables/useAlert'
import useMeeting from '@/modules/meetings/useMeeting'
import useProposals from '@/modules/proposals/useProposals'

import ProposalVue from '@/modules/proposals/Proposal.vue'
import SchemaForm from '@/components/inputs/SchemaForm.vue'

import { ProposalState } from '@/modules/proposals/types'
import usePolls, { polls } from '@/modules/polls/usePolls'
import { InputType } from '@/components/inputs/types'

import { pollMethods as implementedMethods } from './methods'
import { PollStartData, PollMethod, PollMethodSettings, Poll } from './methods/types'
import methodSchemas from './methods/schemas'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'
import useMeetingTitle from '../meetings/useMeetingTitle'

export default defineComponent({
  name: 'StartPoll',
  components: {
    Proposal: ProposalVue,
    SchemaForm
  },
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const proposals = useProposals()
    const { getPollMethods } = usePolls()
    const { agendaId, agendaItem, getAgenda } = useAgenda()
    const { meetingPath, meetingId } = useMeeting()
    const { alert } = useAlert()

    useMeetingTitle(t('poll.start'))

    const selectedProposalIds = ref<number[]>([])
    function getPublishedProposals (agendaItem: number) {
      return proposals.getAgendaProposals(agendaItem, p => p.state === ProposalState.Published)
    }
    const agenda = computed(() => getAgenda(meetingId.value))
    const pollableAgendaItems = computed(() => {
      return agenda.value
        .filter(ai => canAddPoll(ai) && getPublishedProposals(ai.pk).length)
        .map(ai => ({
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
    const availableMethods = computed(() => getPollMethods(selectedProposals.value.length))

    const methodSelected = ref<PollMethod | null>(null)
    const methodSettings = ref<{ title: string } | { title: string } & PollMethodSettings>({ title: '' })
    watch(methodSelected, method => {
      methodSettings.value = { ...(method?.initialSettings || {}), title: nextTitle.value ?? '' }
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
      if (!(methodSelected.value.name in implementedMethods)) return alert(`*${methodSelected.value.name} not implemented`)

      working.value = true
      const { title, ...settings } = methodSettings.value
      // For Repeated Schulze
      if ('winners' in settings && settings.winners === selectedProposals.value.length) settings.winners = null
      const pollData: PollStartData = {
        agenda_item: agendaId.value,
        meeting: meetingId.value,
        title,
        proposals: [...selectedProposalIds.value],
        method_name: methodSelected.value.name,
        start,
        settings: settingsOrNull(settings)
      }
      try {
        const { data } = await pollType.api.add(pollData as Partial<Poll>)
        router.push(`${meetingPath.value}/polls/${data.pk}/${slugify(data.title)}`)
      } catch {
        working.value = false
      }
    }

    const methodSchema = computed(() => {
      if (!methodSelected.value) return
      const getter = methodSchemas[methodSelected.value.name]
      const specifics = getter?.(t, selectedProposals.value) || []
      return [{
        type: InputType.Text,
        name: 'title',
        required: true,
        label: t('title')
      }, ...specifics]
    })

    const nextTitle = computed(() => {
      if (!agendaItem.value) return
      // eslint-disable-next-line no-labels
      outer: for (let n = 1; true; n++) {
        const title = `${agendaItem.value?.title} ${n}`
        for (const poll of polls.values()) {
          // eslint-disable-next-line no-labels
          if (poll.title === title) continue outer
        }
        return title
      }
    })

    watch(agendaId, () => {
      pickMethod.value = false
      selectedProposalIds.value.length = 0
    })

    return {
      t,
      agendaId,
      agendaItem,
      availableProposals,
      selectedProposalIds,
      selectedProposals,
      pickMethod,
      availableMethods,
      methodSchema,
      methodSelected,
      methodSettings,
      pollableAgendaItems,
      readyToCreate,
      settingsValid,
      nextTitle,

      createPoll,
      getAgenda,
      toggleAll,

      ...useMeeting(),
      ...proposals
    }
  }
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
    // border-color: rgb(var(--v-theme-secondary))
    background-color: rgba(var(--v-theme-secondary), .1)
</style>
