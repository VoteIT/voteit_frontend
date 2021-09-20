<template>
  <v-row id="start-poll">
    <v-col lg="8" offset-lg="2">
      <header>
        <h1>{{ t('poll.start') }}</h1>
      </header>
      <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
      <v-btn color="secondary" v-if="agendaId && agendaItem" :to="`${meetingPath}/polls/new`" append-icon="mdi-close">
        {{ agendaItem.title }}
      </v-btn>
      <v-list v-else-if="pollableAgendaItems.length">
        <v-list-item v-for="pollable in pollableAgendaItems" :key="pollable.to" v-bind="pollable" />
      </v-list>
      <v-alert v-else type="info" :text="t('poll.noPollableAgendaItems')" />
      <template v-if="agendaId">
        <h2 class="mt-2">{{ t('step', { step: 2 }) }}: {{ t('poll.pickProposals') }}</h2>
        <div v-if="pickMethod">
          <Proposal read-only
            v-for="p in selectedProposals" :key="p.pk"
            :p="p" class="isSelected locked" />
        </div>
        <v-item-group v-else-if="availableProposals.length" v-model="selectedProposalIds" multiple>
          <v-item v-for="p in availableProposals" :key="p.pk" :value="p.pk" v-slot="{ toggle, isSelected }">
            <Proposal read-only :p="p" @click="toggle()" :class="{ isSelected }" />
          </v-item>
        </v-item-group>
        <p v-else><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
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
              <div v-if="isSelected" @submit.prevent>
                <h3>{{ t('options') }}</h3>
                <SchemaForm :schema="methodSchema" v-model="methodSettings" />
              </div>
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

import { slugify } from '@/utils'

import useAgenda from '@/composables/meeting/useAgenda'
import useAlert from '@/composables/useAlert'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'

import { pollMethods as implementedMethods, pollSettings } from '@/components/pollmethods'
import ProposalComponent from '@/components/widgets/Proposal.vue'
import SchemaForm from '@/components/inputs/SchemaForm.vue'

import pollType from '@/contentTypes/poll'
import { PollStartData, PollMethod, pollMethods, PollMethodSettings } from '@/components/pollmethods/types'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { polls } from '@/composables/meeting/usePolls'
import methodSchemas from '@/components/pollmethods/schemas'
import { InputType } from '@/components/inputs/types'
import { useTitle } from '@vueuse/core'

export default defineComponent({
  name: 'StartPoll',
  components: {
    Proposal: ProposalComponent,
    SchemaForm
  },
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const pollAPI = pollType.getContentApi()
    const proposals = useProposals()
    const { agendaId, agendaItem, getAgenda } = useAgenda()
    const { meetingPath, meetingId } = useMeeting()
    const { alert } = useAlert()

    useTitle(t('poll.start'))

    const selectedProposalIds = ref<number[]>([])
    function getPublishedProposals (agendaItem: number) {
      return proposals.getAgendaProposals(agendaItem, p => p.state === ProposalState.Published)
    }
    const agenda = computed(() => getAgenda(meetingId.value))
    const pollableAgendaItems = computed(() => {
      return agenda.value
        .filter(ai => pollType.rules.canAdd(ai) && getPublishedProposals(ai.pk).length)
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

    function methodFilter (method: PollMethod): boolean {
      const pCount = selectedProposals.value.length
      if (method.proposalsMin && pCount < method.proposalsMin) {
        return false
      }
      if (method.proposalsMax && pCount > method.proposalsMax) {
        return false
      }
      return true
    }
    const pickMethod = ref(false)
    const availableMethods = computed(() => {
      return pollMethods.filter(methodFilter)
    })

    const methodSelected = ref<PollMethod | null>(null)
    const methodSettings = ref<PollMethodSettings | null>(null)
    const methodSettingsComponent = computed(
      () => methodSelected.value && pollSettings[methodSelected.value.name]
    )
    function selectMethod (method: PollMethod) {
      // Toggle
      if (methodSelected.value?.name === method.name) {
        methodSelected.value = null
      } else {
        methodSettings.value = { ...(method.initialSettings || {}), title: nextTitle.value }
        methodSelected.value = method
      }
    }

    const working = ref(false)
    const createdPollPk = ref(null)
    const readyToCreate = computed(() => {
      return methodSelected.value && !working.value && !createdPollPk.value
    })

    async function createPoll (start = false) {
      if (methodSelected.value) {
        if (methodSelected.value.name in implementedMethods) {
          working.value = true
          let settings: PollMethodSettings | null = { ...methodSettings.value }
          delete settings.title
          if (Object.keys(settings).length === 0) settings = null
          const pollData: PollStartData = {
            agenda_item: agendaId.value,
            meeting: meetingId.value,
            title: methodSettings.value?.title,
            proposals: [...selectedProposalIds.value],
            method_name: methodSelected.value.name,
            start,
            settings
          }
          try {
            const { data } = await pollAPI.add(pollData)
            router.push(`${meetingPath.value}/polls/${data.pk}/${slugify(data.title)}`)
          } catch {
            working.value = false
          }
        } else {
          alert(`*${methodSelected.value.title} not implemented`)
        }
      }
    }

    const methodSchema = computed(() => {
      if (!methodSelected.value) return
      const getter = methodSchemas[methodSelected.value.name]
      const specifics = getter?.(t, selectedProposalIds.value.length) || []
      return [{
        type: InputType.Text,
        name: 'title',
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
      methodSettingsComponent,
      pollableAgendaItems,
      readyToCreate,
      nextTitle,

      createPoll,
      getAgenda,
      selectMethod,
      toggleAll,

      ...useMeeting(),
      ...proposals,
      ...pollType.rules
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
      background-color: rgb(var(--v-theme-success-lighten-2))
      a::before
        content: '✔'
      &.locked
        background-color: #ddd
    span
      display: block
      padding: 6px 6px 6px calc(6px + 1.2em)

  .proposal
    margin: 1.5em .5em
    &.isSelected
      background-color: rgb(var(--v-theme-success-lighten-2))
      outline: .5em solid rgb(var(--v-theme-success-lighten-2))
      position: relative
      &::after
        content: '✓'
        font-size: 22pt
        position: absolute
        top: -10px
        right: -5px
      &.locked
        background-color: rgb(var(--v-theme-secondary-lighten-2))
        outline-color: rgb(var(--v-theme-secondary-lighten-2))
</style>
