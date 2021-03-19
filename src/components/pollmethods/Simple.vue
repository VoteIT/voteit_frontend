<template>
  <form @submit.prevent>
    <Proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="simple-options">
          <Btn v-for="opt in options" :key="opt.value" :color="opt.color" :border="opt.value !== votes.get(p.pk)" :icon="opt.icon" @click="change(p, opt)">
            {{ opt.title }}
          </Btn>
        </div>
      </template>
    </Proposal>
  </form>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, reactive, watch } from 'vue'
import { DefaultMap } from '@/utils'

import useMeeting from '@/composables/meeting/useMeeting'

import ProposalComponent from '../widgets/Proposal.vue'

import { CombinedSimpleVote, SimpleChoice, simpleIcons, SimpleVote, SingleSimpleVote } from './types'
import { Poll, Proposal } from '@/contentTypes/types'

export default defineComponent({
  name: 'SimplePoll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    proposals: {
      type: Array as PropType<Proposal[]>,
      required: true
    },
    modelValue: {
      type: Object as PropType<SimpleVote>
    }
  },
  components: {
    Proposal: ProposalComponent
  },
  setup (props, { emit }) {
    const t = inject('t') as CallableFunction // TODO What?
    const { getUser } = useMeeting()
    const votes = reactive<Map<number, SimpleChoice>>(new Map())
    const isCombined = props.poll.method_name === 'combined_simple'

    interface Option {
      value: SimpleChoice
      title: string
      icon: string
      color: string
    }

    const options = [
      {
        value: SimpleChoice.Yes,
        title: t('poll.approve'),
        icon: simpleIcons.yes,
        color: 'success'
      },
      {
        value: SimpleChoice.No,
        title: t('poll.deny'),
        icon: simpleIcons.no,
        color: 'warning'
      }
    ]

    if (isCombined) {
      options.push({
        value: SimpleChoice.Abstain,
        title: t('poll.abstain'),
        icon: simpleIcons.abstain,
        color: 'secondary'
      })
    }

    function change (proposal: Proposal, opt: Option) {
      votes.set(proposal.pk, opt.value)
      if (isCombined) {
        const map = new DefaultMap<SimpleChoice, number[]>(() => [])
        for (const [pk, choice] of votes.entries()) {
          map.get(choice).push(pk)
        }
        emit('update:modelValue', Object.fromEntries(map))
      } else {
        emit('update:modelValue', { choice: opt.value })
      }
    }

    function setSingle (vote: SingleSimpleVote) {
      votes.set(props.proposals[0].pk, vote.choice)
    }

    watch(() => props.modelValue, (vote?: SimpleVote) => {
      if (isCombined) {
        for (const [choice, pks] of Object.entries(vote as CombinedSimpleVote)) {
          pks.forEach((pk: number) => {
            votes.set(pk, choice as SimpleChoice)
          })
        }
      } else {
        setSingle(vote as SingleSimpleVote)
      }
    })

    return {
      change,
      votes,
      options,
      getUser
    }
  }
})
</script>

<style lang="sass">
.simple-options
  text-align: center
  button
    margin-right: .4rem
    &:last-child
      margin-right: 0
</style>
