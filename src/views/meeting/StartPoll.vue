<template>
  <div>
    <h1>Start poll</h1>
    <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
    <Btn class="selected" v-if="agendaId" @click="$router.push(`${meetingPath}/polls/new`)">{{ agendaItem.title }} <Icon>close</Icon></Btn>
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
      <h2>{{ t('step', { step: 2 }) }}: {{ t('poll.pickProposals') }}</h2>
      <div v-if="pickMethod">
        <Proposal read-only
          v-for="p in selectedProposals" :key="p.pk"
          :p="p" selected />
      </div>
      <div v-else-if="availableProposals.length">
        <Proposal read-only
          v-for="p in availableProposals" :key="p.pk"
          :p="p" @click="toggleSelected(p)" :selected="selectedProposalIds.has(p.pk)" />
      </div>
      <p v-else><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
      <div v-if="!pickMethod" class="btn-group">
        <Btn icon="done_all" @click="toggleAll">{{ t('all') }}</Btn>
        <Btn icon="forward" :disabled="!selectedProposals.length" @click="pickMethod=true">{{ t('continue') }}</Btn>
      </div>
    </template>
    <template v-if="pickMethod">
      <h2>{{ t('step', { step: 3 }) }}: {{ t('poll.chooseMethod') }}</h2>
      <ul>
        <li :class="{ selected: methodSelected && m.name === methodSelected.name }" v-for="m in availableMethods" :key="m.name">
          <a href="#" @click.prevent="selectMethod(m)">{{ m.title }}</a>
          <div v-if="methodSettingsComponent && m.name === methodSelected.name">
            <h3>{{ t('options') }}</h3>
            <component :is="methodSettingsComponent" v-model="methodSettings" :method="m" :proposals="selectedProposals.length" />
          </div>
        </li>
      </ul>
      <div class="btn-group">
        <Btn icon="undo" @click="pickMethod=false">{{ t('back') }}</Btn>
        <Btn icon="check" :disabled="!readyToCreate" @click="createPoll()">{{ t('create') }}</Btn>
        <Btn icon="play_arrow" :disabled="!readyToCreate" @click="createPoll(true)">{{ t('poll.createAndStart') }}</Btn>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { slugify } from '@/utils'

import useAgenda from '@/composables/meeting/useAgenda'
import useAlert from '@/composables/useAlert'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'

import { pollMethods as implementedMethods, pollSettings } from '@/components/pollmethods'
import ProposalComponent from '@/components/widgets/Proposal.vue'

import pollType from '@/contentTypes/poll'
import { Poll } from '@/contentTypes/types'
import { PollStartData, PollMethod, pollMethods, PollMethodSettings } from '@/components/pollmethods/types'
import { ProposalState } from '@/contentTypes/proposal/workflowStates'

export default defineComponent({
  name: 'StartPoll',
  inject: ['t'],
  components: {
    Proposal: ProposalComponent
  },
  setup () {
    const router = useRouter()
    const pollAPI = pollType.useContentApi()
    // const restApi = useRestApi()
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
      if (methodSelected.value && methodSelected.value.name === method.name) {
        methodSelected.value = null
      } else {
        methodSettings.value = method.initialSettings || null
        methodSelected.value = method
      }
    }

    const working = ref(false)
    const createdPollPk = ref(null)
    const readyToCreate = computed(() => {
      return methodSelected.value && !working.value && !createdPollPk.value
    })

    function createPoll (start = false) {
      if (methodSelected.value) {
        if (methodSelected.value.name in implementedMethods) {
          working.value = true
          const pollData: PollStartData = {
            agenda_item: agendaId.value,
            meeting: meetingId.value,
            proposals: [...selectedProposalIds],
            method_name: methodSelected.value.name,
            start,
            settings: methodSettings.value
          }
          pollAPI.add(pollData)
            .then(({ data }) => {
              router.push(`${meetingPath.value}/polls/${data.pk}/${slugify(data.title)}`)
            })
            .finally(() => {
              working.value = false
            })
        } else {
          alert(`*${methodSelected.value.title} not implemented`)
        }
      }
    }

    watch(agendaId, () => {
      pickMethod.value = false
      selectedProposalIds.clear()
    })

    return {
      selectedProposalIds,
      selectedProposals,
      getPublishedProposals,
      availableProposals,
      toggleSelected,
      toggleAll,

      pickMethod,
      availableMethods,
      methodSelected,
      methodSettings,
      methodSettingsComponent,
      selectMethod,
      readyToCreate,
      createPoll,

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

<style lang="sass" scoped>
ul
  padding: 0
li
  &.disabled
    color: var(--disabled-text)
  list-style: none
  border-top: var(--agenda-separator)
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
    background-color: var(--proposal-selected)
    a:before
      content: '✔'
  &.selected.locked
    background-color: #ddd
  span
    display: block
    padding: 6px 6px 6px calc(6px + 1.2em)
</style>
