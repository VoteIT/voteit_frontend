<template>
  <div id="scottish-stv-voting">
    <div class="header">
      <h2>{{ t('step', currentStep) }}: {{ currentStep.title }}</h2>
      <p>{{ currentStep.description }}</p>
    </div>
    <template v-if="currentStep.step === 1">
      <Proposal :selected="ranking.includes(p.pk)" read-only :p="p" v-for="p in proposals" :key="p.pk" @click="toggleSelected(p)">
        <template v-slot:top>
          <div class="ranking-position" v-if="ranking.includes(p.pk)">
            <span>{{ (ranking.indexOf(p.pk) + 1) }}</span>
          </div>
        </template>
      </Proposal>
    </template>
    <template v-if="currentStep.step === 2">
      <Draggable v-model="orderedProposals" item-key="pk">
        <template #item="{ element }">
          <Proposal read-only selected :p="element">
            <template v-slot:top>
              <div class="ranking-position">
                <span>{{ (ranking.indexOf(element.pk) + 1) }}</span>
              </div>
            </template>
          </Proposal>
        </template>
      </Draggable>
    </template>
    <div class="btn-controls">
      <btn v-if="previousStep" icon="undo" @click="previous()">{{ previousStep.title }}</btn>
      <span v-else/>
      <btn v-if="nextStep" icon="forward" :disabled="!currentStep.ready" @click="next()">{{ nextStep.title }}</btn>
      <span v-else/>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, reactive, ref, watch } from 'vue'
import Draggable from 'vuedraggable'

import ProposalComponent from '../widgets/Proposal.vue'

import { RankedVote } from './types'
import { Poll, Proposal } from '@/contentTypes/types'

export default defineComponent({
  name: 'ScottishSTVPoll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    proposals: {
      type: Array as PropType<Proposal[]>,
      required: true
    },
    modelValue: Object as PropType<RankedVote>,
    settings: {
      type: Object,
      default: () => ({ minRanked: 1 })
    }
  },
  components: {
    Proposal: ProposalComponent,
    Draggable
  },
  setup (props, { emit }) {
    const t = inject('t') as CallableFunction
    const steps = reactive([
      {
        step: 1,
        title: t('poll.selectProposals'),
        description: t('poll.selectProposalsDescription'),
        ready: false
      },
      {
        step: 2,
        title: t('poll.orderProposals'),
        description: t('poll.orderProposalsDescription')
      }
    ])

    const ranking = ref<number[]>([])
    const step = ref(0)
    const previousStep = computed(() => steps[step.value - 1])
    const currentStep = computed(() => steps[step.value])
    const nextStep = computed(() => steps[step.value + 1])

    watch(() => props.modelValue, (vote) => {
      if (vote) {
        ranking.value = vote.ranking
        steps[0].ready = true
      }
    })

    function setOrder (order?: number[]) {
      if (order) {
        ranking.value = order
      }
      emit('update:modelValue', { ranking: ranking.value })
    }

    function toggleSelected (proposal: Proposal) {
      if (ranking.value.includes(proposal.pk)) {
        ranking.value = ranking.value.filter(p => p !== proposal.pk)
      } else {
        ranking.value.push(proposal.pk)
      }
      if (ranking.value.length >= props.settings.minRanked) {
        setOrder()
      } else {
        emit('update:modelValue', null)
      }
    }

    function next () {
      if (currentStep.value.ready) {
        step.value++
      }
    }

    function previous () {
      step.value--
    }

    const orderedProposals = computed({
      get: () => ranking.value.map((pk: number) => props.proposals.find(p => p.pk === pk)) as Proposal[],
      set: (proposals: Proposal[]) => setOrder(proposals.map(p => p.pk))
    })

    return {
      t,
      ranking,
      setOrder,
      toggleSelected,
      orderedProposals,

      previousStep,
      currentStep,
      nextStep,
      previous,
      next
    }
  }
})
</script>

<style lang="sass">
#scottish-stv-voting
  margin-bottom: 1em

  .header p
    white-space: pre-wrap

  .proposal
    position: relative
    cursor: pointer
    &[data-draggable]
      cursor: grab
  .ranking-position
    position: absolute
    top: 5px
    right: 5px
    width: 30px
    height: 30px
    background-color: #f7f7f7
    color: #000
    display: flex
    justify-content: center
    align-items: center
    border-radius: 50%
    box-shadow: 1px 2px 3px inset rgba(#000, .4)
    font-size: 14pt

  .btn-controls
    display: flex
    justify-content: space-between
</style>
