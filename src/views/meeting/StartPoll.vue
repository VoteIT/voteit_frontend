<template>
  <v-row id="start-poll">
    <v-col lg="8" offset-lg="2">
      <header>
        <h1>Start poll</h1>
      </header>
      <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
      <v-btn color="secondary" v-if="agendaId && agendaItem" @click="$router.push(`${meetingPath}/polls/new`)" append-icon="mdi-close">
        {{ agendaItem.title }}
      </v-btn>
      <ul v-else>
        <template v-for="ai in getAgenda(meetingId)" :key="ai.pk">
          <li v-if="canAdd(ai) && getPublishedProposals(ai.pk).length">
            <RouterLink :to="`${meetingPath}/polls/new/${ai.pk}`">{{ ai.title }} ({{ getPublishedProposals(ai.pk).length }})</RouterLink>
          </li>
          <li v-else class="disabled">
            <span>{{ ai.title }} (-)</span>
          </li>
        </template>
      </ul>
      <template v-if="agendaId">
        <h2 class="mt-2">{{ t('step', { step: 2 }) }}: {{ t('poll.pickProposals') }}</h2>
        <div v-if="pickMethod">
          <Proposal read-only
            v-for="p in selectedProposals" :key="p.pk"
            :p="p" class="selected locked" />
        </div>
        <div v-else-if="availableProposals.length">
          <Proposal read-only
            v-for="p in availableProposals" :key="p.pk"
            :p="p" @click="toggleSelected(p)" :class="{ selected: selectedProposalIds.has(p.pk) }" />
        </div>
        <p v-else><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
        <div v-if="!pickMethod" class="btn-group mt-3">
          <Btn icon="mdi-check-all" @click="toggleAll">{{ t('all') }}</Btn>
          <Btn icon="mdi-arrow-right-bold" :disabled="!selectedProposals.length" @click="pickMethod=true">{{ t('continue') }}</Btn>
        </div>
      </template>
      <template v-if="pickMethod">
        <h2 class="mt-2">{{ t('step', { step: 3 }) }}: {{ t('poll.chooseMethod') }}</h2>
        <ul class="method-list">
          <li :class="{ selected: methodSelected?.name === m.name }" v-for="m in availableMethods" :key="m.name">
            <a href="#" @click.prevent="selectMethod(m)">{{ t(`poll.method.${m.name}`) }}</a>
            <div v-if="methodSelected && m.name === methodSelected.name" @submit.prevent>
              <h3>{{ t('options') }}</h3>
              <SchemaForm :schema="methodSchema" v-model="methodSettings" />
              <!-- <component v-if="methodSettingsComponent" :is="methodSettingsComponent" v-model="methodSettings" :method="m" :proposals="selectedProposals.length" /> -->
            </div>
          </li>
        </ul>
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
import { computed, defineComponent, reactive, ref, watch } from 'vue'
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
import { Poll } from '@/contentTypes/types'
import { PollStartData, PollMethod, pollMethods, PollMethodSettings } from '@/components/pollmethods/types'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'
import { polls } from '@/composables/meeting/usePolls'
import methodSchemas from '@/components/pollmethods/schemas'
import { InputType, SchemaInput } from '@/components/inputs/types'

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

    const selectedProposalIds = reactive<Set<number>>(new Set())
    function getPublishedProposals (agendaItem: number) {
      return proposals.getAgendaProposals(agendaItem, ProposalState.Published)
    }
    const availableProposals = computed(() => getPublishedProposals(agendaId.value))
    const selectedProposals = computed(() => availableProposals.value.filter(p => selectedProposalIds.has(p.pk)))

    function toggleSelected (p: Poll) {
      if (!pickMethod.value) {
        if (selectedProposalIds.has(p.pk)) {
          selectedProposalIds.delete(p.pk)
        } else {
          selectedProposalIds.add(p.pk)
        }
      }
    }
    function toggleAll () {
      if (selectedProposals.value.length === availableProposals.value.length) {
        selectedProposalIds.clear()
      } else {
        availableProposals.value
          .forEach(p => selectedProposalIds.add(p.pk))
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
            proposals: [...selectedProposalIds],
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

    const methodSchema = computed<SchemaInput[] | undefined>(() => {
      if (!methodSelected.value) return
      const getter = methodSchemas[methodSelected.value.name]
      const specifics = getter?.(t, selectedProposalIds.size) || []
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
      selectedProposalIds.clear()
    })

    return {
      t,
      selectedProposalIds,
      selectedProposals,
      getPublishedProposals,
      availableProposals,
      toggleSelected,
      toggleAll,

      pickMethod,
      availableMethods,
      methodSchema,
      methodSelected,
      methodSettings,
      methodSettingsComponent,
      selectMethod,
      readyToCreate,
      createPoll,
      nextTitle,

      agendaId,
      agendaItem,
      getAgenda,

      ...useMeeting(),
      ...proposals,
      ...pollType.rules
    }
  }
})
</script>

<style lang="sass">
#start-poll
  ul.method-list
    padding: 0
    margin-bottom: 1em
  li
    &.disabled
      color: rgb(var(--v-theme-secondary))
    list-style: none
    border-top: var(--v-border-color)
    &:last-child
      border-bottom: var(--agenda-separator)
    h3
      margin-top: 0
    > div
      padding: .5rem 1rem 1rem
    .number label
      display: block
    a
      display: block
      text-decoration: none
      padding: 6px
      color: var(--text)
      &:before
        content: ''
        width: 1.2rem
        display: inline-block
        line-height: 1
    &.selected
      background-color: rgba(var(--v-theme-success-lighten-2), 1)
      a:before
        content: '✔'
    &.selected.locked
      background-color: #ddd
    span
      display: block
      padding: 6px 6px 6px calc(6px + 1.2em)

  .proposal
    margin: 1.5em .5em
    &.selected
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
