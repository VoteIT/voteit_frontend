<template>
  <div>
    <h1>Start poll</h1>
    <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
    <btn class="selected" v-if="agendaId" @click="$router.push(`${meetingPath}/polls/new`)">{{ agendaItem.title }} <icon name="close"/></btn>
    <ul v-else>
      <template v-for="ai in getAgenda(meetingId)" :key="ai.pk">
        <li v-if="canAdd(ai)">
          <router-link :to="`${meetingPath}/polls/new/${ai.pk}`">{{ ai.title }}</router-link>
        </li>
      </template>
    </ul>
    <template v-if="agendaId">
      <h2>{{ t('step', { step: 2 }) }}: {{ t('poll.pickProposals') }}</h2>
      <div v-if="pickMethod">
        <proposal read-only
          v-for="p in selectedProposals" :key="p.pk"
          :p="p" selected />
      </div>
      <div v-else-if="availableProposals.length">
        <proposal read-only
          v-for="p in availableProposals" :key="p.pk"
          :p="p" @click="toggleSelected(p)" :selected="selectedProposalIds.has(p.pk)" />
      </div>
      <p v-else><em>{{ t('poll.noAiPublishedProposals') }}</em></p>
      <div v-if="!pickMethod" class="btn-group">
        <icon button name="done_all" @click="toggleAll">{{ t('all') }}</icon>
        <icon button name="forward" :disabled="!selectedProposals.length" @click="pickMethod=true">{{ t('continue') }}</icon>
      </div>
    </template>
    <template v-if="pickMethod">
      <h2>{{ t('step', { step: 3 }) }}: {{ t('poll.chooseMethod') }}</h2>
      <ul>
        <li :class="{ selected: m.name === methodSelected }" v-for="m in availableMethods" :key="m.name">
          <a href="#" @click.prevent="selectMethod(m)">{{ m.title }}</a>
          <div v-if="methodSettings && m.name === methodSelected">
            <!-- TODO Load schema for method, preferably providing proposal count -->
            <h3>{{ t('options') }}</h3>
            <p v-if="!m.losersMin" class="checkbox">
              <input :id="m.name + '-order-all'" type="checkbox" v-model="methodSettings.orderAll">
              <label :for="m.name + '-order-all'">{{ t('poll.orderAll') }}</label>
            </p>
            <p class="number">
              <label :for="m.name + '-winners'">{{ t('winners') }}</label>
              <input :id="m.name + '-winners'" v-model="methodSettings.winners" type="number" :min="m.winnersMin || 1" :max="selectedProposals.length - (m.losersMin || 0)" :disabled="methodSettings.orderAll">
            </p>
          </div>
        </li>
      </ul>
      <div class="btn-group">
        <btn icon="undo" @click="pickMethod=false">{{ t('back') }}</btn>
        <btn icon="check" :disabled="!readyToCreate" @click="createPoll()">{{ t('create') }}</btn>
        <btn icon="play_arrow" :disabled="!readyToCreate" @click="createPoll(true)">{{ t('poll.createAndStart') }}</btn>
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
import useRestApi from '@/composables/useRestApi'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'

import { pollMethods as implementedMethods } from '@/components/pollmethods'
import ProposalComponent from '@/components/widgets/Proposal.vue'

import rules from '@/contentTypes/poll/rules'
import { Poll } from '@/contentTypes/types'
import { PollData, PollMethod, pollMethods, PollMethodSettings } from '@/components/pollmethods/types'

export default defineComponent({
  name: 'StartPoll',
  inject: ['t'],
  components: {
    Proposal: ProposalComponent
  },
  setup () {
    const router = useRouter()
    const restApi = useRestApi()
    const proposals = useProposals()
    const { agendaId, agendaItem, getAgenda } = useAgenda()
    const { meetingPath } = useMeeting()
    const { alert } = useAlert()

    const selectedProposalIds = reactive<Set<number>>(new Set())
    const availableProposals = computed(() => proposals.getAgendaProposals(agendaId.value, 'published'))
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
    const methodSelected = ref<string | null>(null)
    const methodSettings = ref<PollMethodSettings | null>(null)
    function selectMethod (method: PollMethod) {
      // If same, deselect
      if (methodSelected.value === method.name) {
        methodSelected.value = null
      } else {
        methodSelected.value = method.name
        // TODO Proper settings schema
        methodSettings.value = method.initialSettings || null
      }
    }

    const working = ref(false)
    const createdPollPk = ref(null)
    const readyToCreate = computed(() => {
      return methodSelected.value && !working.value && !createdPollPk.value
    })

    function createPoll (start = false) {
      const method = pollMethods.find(m => m.name === methodSelected.value)
      if (!method) return
      if (method.name in implementedMethods) {
        working.value = true
        const pollData: PollData = {
          agenda_item: agendaId.value,
          proposal_pks: [...selectedProposalIds].join(','),
          method_name: method.name,
          start,
          settings: methodSettings.value ? { ...methodSettings.value } : null // Copy settings
        }
        if (pollData.settings && pollData.settings.orderAll) pollData.settings.winners = null // Special orderAll case...
        restApi.post('polls/', pollData)
          .then(({ data }) => {
            router.push(`${meetingPath.value}/polls/${data.pk}/${slugify(data.title)}`)
          })
          .finally(() => {
            working.value = false
          })
      } else {
        alert(`*${method.title} not implemented`)
      }
    }

    watch(agendaId, () => {
      pickMethod.value = false
      selectedProposalIds.clear()
    })

    return {
      selectedProposalIds,
      selectedProposals,
      availableProposals,
      toggleSelected,
      toggleAll,

      pickMethod,
      availableMethods,
      methodSelected,
      methodSettings,
      selectMethod,
      readyToCreate,
      createPoll,

      agendaId,
      agendaItem,
      getAgenda,

      ...useMeeting(),
      ...proposals,
      ...rules
    }
  }
})
</script>

<style lang="sass" scoped>
ul
  padding: 0
li
  list-style: none
  border-top: 1px solid #eee
  &:last-child
    border-bottom: 1px solid #eee
  h3
    margin-top: 0
  > div
    padding: .5rem 1rem 1rem
  .number label
    display: block
  a
    text-decoration: none
    padding: 6px
    color: #000
    display: block
    &:before
      content: ''
      width: 1.2rem
      display: inline-block
      line-height: 1
  &.selected
    background-color: #ded
    a:before
      content: '✔'
  &.selected.locked
    background-color: #ddd
</style>
