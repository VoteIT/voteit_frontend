<template>
  <div id="scottish-stv-voting">
    <template v-if="currentStep.step === 1">
      <Proposal :selected="ranking.includes(p.pk)" read-only :p="p" v-for="p in proposals" :key="p.pk" @click="toggleSelected(p)">
        <template v-slot:vote>
          <div class="ranking-position">
            {{ ranking.includes(p.pk) ? t('poll.rankingSelectedAs') : t('poll.rankingSelectAs') }}
            <span class="number" :class="{ active: ranking.includes(p.pk) }">{{ ranking.indexOf(p.pk) + 1 || ranking.length + 1 }}</span>
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
    <!-- <div class="btn-controls">
      <v-btn color="secondary" v-if="previousStep" @click="previous()"><v-icon left icon="mdi-arrow-left-bold"/>{{ previousStep.title }}</v-btn>
      <span v-else/>
      <v-btn color="secondary" v-if="nextStep" :disabled="!currentStep.ready" @click="next()">{{ nextStep.title }}<v-icon right icon="mdi-arrow-right-bold"/></v-btn>
      <span v-else/>
    </div> -->
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref } from 'vue'
import Draggable from 'vuedraggable'

import ProposalComponent from '../widgets/Proposal.vue'

import { RankedVote } from './types'
import { Poll, Proposal } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'

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
    const { t } = useI18n()
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

    const ranking = ref<number[]>(props.modelValue?.ranking ?? [])
    const step = ref(0)
    const previousStep = computed(() => steps[step.value - 1])
    const currentStep = computed(() => steps[step.value])
    const nextStep = computed(() => steps[step.value + 1])

    // watch(() => props.modelValue, (vote) => {
    //   if (vote) {
    //     ranking.value = vote.ranking
    //     steps[0].ready = true
    //   }
    // })

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
@keyframes bounce-in
  0%
    transform: scale(1) rotate(0)
  50%
    transform: scale(1.5) rotate(6deg)
  100%
    transform: scale(1) rotate(0)

@keyframes sink-in
  0%
    transform: scale(1)
  50%
    transform: scale(.8)
  100%
    transform: scale(1)

#scottish-stv-voting
  .header p
    white-space: pre-wrap

  .proposal
    position: relative
    cursor: pointer
    &[data-draggable]
      cursor: grab

  .btn-controls
    display: flex
    justify-content: space-between

  .ranking-position
    text-align: center
    .number
      display: inline-block
      border-radius: 50%
      width: 23px
      height: 23px
      transition: background-color .4s
      background-color: rgba(var(--v-theme-secondary), .3)
      animation: sink-in .4s
      &.active
        background-color: rgb(var(--v-theme-success))
        animation: bounce-in .4s
</style>
