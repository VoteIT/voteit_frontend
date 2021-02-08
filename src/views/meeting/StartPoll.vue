<template>
  <div v-if="createdPoll">
    <h1>{{ t('poll.Created') }}</h1>
    <poll :poll="createdPoll"/>
  </div>
  <div v-else>
    <h1>Start poll</h1>
    <h2>{{ t('step', { step: 1 }) }}: {{ t('poll.selectAgendaItem') }}</h2>
    <btn class="selected" v-if="agendaId" @click="$router.push(`${meetingPath}/polls/new`)">{{ agendaItem.title }} <icon name="close"/></btn>
    <ul v-else>
      <li v-for="ai in getAgenda(meetingId)" :key="ai.pk">
        <router-link :to="`${meetingPath}/polls/new/${ai.pk}`">{{ ai.title }}</router-link>
      </li>
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
          <div v-show="m.name === methodSelected" v-if="m.multipleWinners">
            <!-- TODO Load schema for method, preferably providing proposal count -->
            <h3>{{ t('options') }}</h3>
            <label :for="m.name + '_winners'">{{ t('winners') }}</label>
            <input :id="m.name + '_winners'" type="number" :value="m.winnersMin || 1" :min="m.winnersMin || 1" :max="selectedProposals.size - (m.losersMin || 0)">
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

<script>
import { computed, ref, watch } from 'vue'
import useAlert from '@/composables/useAlert.js'
import useRestApi from '../../composables/useRestApi'

import useMeeting from '@/composables/meeting/useMeeting.js'
import useAgenda from '@/composables/meeting/useAgenda.js'
import useProposals from '@/composables/meeting/useProposals.js'
import usePolls from '@/composables/meeting/usePolls.js'

import pollMethods from '@/schemas/pollMethods.json'

import Poll from '@/components/widgets/Poll'
import Proposal from '@/components/widgets/Proposal'

export default {
  name: 'StartPoll',
  inject: ['t'],
  components: {
    Poll,
    Proposal
  },
  setup () {
    const restApi = useRestApi()
    const proposals = useProposals()
    const { agendaId, agendaItem, getAgenda } = useAgenda()
    const { getPoll } = usePolls()
    const { alert } = useAlert()

    const selectedProposalIds = ref(new Set())
    const availableProposals = computed(_ => proposals.getAgendaProposals(agendaId.value, 'published'))
    const selectedProposals = computed(_ => availableProposals.value.filter(p => selectedProposalIds.value.has(p.pk)))

    function toggleSelected (p) {
      if (!pickMethod.value) {
        if (selectedProposalIds.value.has(p.pk)) {
          selectedProposalIds.value.delete(p.pk)
        } else {
          selectedProposalIds.value.add(p.pk)
        }
      }
    }
    function toggleAll () {
      if (selectedProposals.value.length === availableProposals.value.length) {
        selectedProposalIds.value.clear()
      } else {
        availableProposals.value
          .forEach(p => selectedProposalIds.value.add(p.pk))
      }
    }

    function methodFilter (m) {
      const pCount = selectedProposals.value.length
      if (m.proposalsMin && pCount < m.proposalsMin) {
        return false
      }
      if (m.proposalsMax && pCount > m.proposalsMax) {
        return false
      }
      return true
    }
    const pickMethod = ref(false)
    const availableMethods = computed(_ => {
      return pollMethods.filter(methodFilter)
    })
    const methodSelected = ref(null)
    function selectMethod (m) {
      methodSelected.value = methodSelected.value === m.name ? null : m.name
    }

    const working = ref(false)
    const createdPollPk = ref(null)
    const createdPoll = computed(_ => getPoll(createdPollPk.value))
    const readyToCreate = computed(_ => {
      return methodSelected.value && !working.value && !createdPollPk.value
    })

    function createPoll (start = false) {
      const method = pollMethods.find(m => m.name === methodSelected.value)
      if (method.name === 'simple') {
        working.value = true
        restApi.post('polls/', {
          agenda_item: agendaId.value,
          proposal_pks: [...selectedProposalIds.value].join(','),
          method_name: method.name,
          start
        })
          .then(({ data }) => {
            createdPollPk.value = data.pk
          })
          .finally(_ => {
            working.value = false
          })
      } else {
        alert(`*${method.title} not implemented`)
      }
    }

    watch(agendaId, _ => {
      pickMethod.value = false
      selectedProposalIds.value.clear()
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
      selectMethod,
      readyToCreate,
      createPoll,
      createdPoll,

      agendaId,
      agendaItem,
      getAgenda,

      ...useMeeting(),
      ...proposals
    }
  }
}
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
  div
    padding: .5rem 1rem 1rem
  label
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
