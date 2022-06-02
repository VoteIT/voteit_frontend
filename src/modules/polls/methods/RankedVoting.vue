<template>
  <div id="scottish-stv-voting">
    <!-- <template v-if="currentStep.step === 1"> -->
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="voting-controls" v-if="ranking.includes(p.pk)">
          <div class="left">
            <span class="number">
              {{ ranking.indexOf(p.pk) + 1 }}
            </span>
          </div>
          <div class="center">
            <v-btn variant="text" size="small" @click="toggleSelected(p)">
              {{ t('poll.rankingSelectedAs') }}
              {{ ranking.indexOf(p.pk) + 1 || ranking.length + 1 }}
            </v-btn>
          </div>
          <div class="right">
            <v-btn outlined color="primary" size="small" @click="toggleSelected(p)">
              {{ t('clear') }}
            </v-btn>
          </div>
        </div>
        <div class="voting-controls" v-else>
          <div class="center">
            <v-btn :disabled="disabled" color="primary" @click="toggleSelected(p)">
              {{ t('poll.rankingSelectAs') }}
              {{ ranking.indexOf(p.pk) + 1 || ranking.length + 1 }}
            </v-btn>
          </div>
        </div>
      </template>
    </Proposal>
    <!-- </template> -->
    <!-- <template v-if="currentStep.step === 2">
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
    </template> -->
    <!-- <div class="btn-controls">
      <v-btn color="secondary" v-if="previousStep" @click="previous()"><v-icon left icon="mdi-arrow-left-bold"/>{{ previousStep.title }}</v-btn>
      <span v-else/>
      <v-btn color="secondary" v-if="nextStep" :disabled="!currentStep.ready" @click="next()">{{ nextStep.title }}<v-icon right icon="mdi-arrow-right-bold"/></v-btn>
      <span v-else/>
    </div> -->
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
// import Draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'

import { Poll, RankedVote } from './types'

export default defineComponent({
  name: 'ScottishSTVPoll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    modelValue: Object as PropType<RankedVote>,
    disabled: Boolean
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { getProposal } = useProposals()
    // const steps = reactive([
    //   {
    //     step: 1,
    //     title: t('poll.selectProposals'),
    //     description: t('poll.selectProposalsDescription'),
    //     ready: false
    //   },
    //   {
    //     step: 2,
    //     title: t('poll.orderProposals'),
    //     description: t('poll.orderProposalsDescription')
    //   }
    // ])

    const ranking = ref<number[]>(props.modelValue?.ranking ?? [])
    // const step = ref(0)
    // const previousStep = computed(() => steps[step.value - 1])
    // const currentStep = computed(() => steps[step.value])
    // const nextStep = computed(() => steps[step.value + 1])

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

    // TODO: Allow setting min proposals to rank.
    const minRanked = computed(() => 1)

    function toggleSelected (proposal: Proposal) {
      if (props.disabled) return
      if (ranking.value.includes(proposal.pk)) {
        ranking.value = ranking.value.filter(p => p !== proposal.pk)
      } else {
        ranking.value.push(proposal.pk)
      }
      if (ranking.value.length >= minRanked.value) {
        setOrder()
      } else {
        emit('update:modelValue', null)
      }
    }

    const proposals = computed(() => props.poll.proposals.map(getProposal) as Proposal[])

    return {
      t,
      ranking,
      // setOrder,
      toggleSelected,
      // orderedProposals,
      proposals

      // previousStep,
      // currentStep,
      // nextStep,
      // previous,
      // next
    }
  }
})
</script>

<style lang="sass">
@keyframes bounce-in
  0%
    transform: scale(1) rotate(0)
  50%
    transform: scale(1.3) rotate(6deg)
  100%
    transform: scale(1) rotate(0)

#scottish-stv-voting
  .header p
    white-space: pre-wrap

  .proposal
    position: relative
    &[data-draggable]
      cursor: grab

  .voting-controls
    display: flex
    align-items: center
    .center
      text-align: center
      flex: 1 0 50%
    .left
      text-align: left
      flex: 0 1 25%
    .right
      text-align: right
      flex: 0 1 25%

  .number
    display: inline-block
    text-align: center
    border-radius: 50%
    width: 23px
    height: 23px
    background-color: rgb(var(--v-theme-success))
    animation: bounce-in .3s

</style>
