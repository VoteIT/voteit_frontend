<template>
  <form @submit.prevent>
    <Proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="simple-options">
          <span class="vote-option" :style="{ backgroundColor: opt.value === votes.get(p.pk) ? opt.color : undefined }" :class="{ active: opt.value === votes.get(p.pk) }" v-for="opt in options" :key="opt.value">
            <label :for="`${p.pk}-${opt.value}`" tabindex="0" @click="change(p, opt)" @keyup.space.enter="change(p, opt)">
              <input :checked="opt.value === votes.get(p.pk)" type="radio" name="vote" :value="opt.value" :id="`${p.pk}-${opt.value}`" />
              <Icon sm :name="opt.icon" />
              {{ opt.title }}
            </label>
          </span>
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
        color: '#cdc'
      },
      {
        value: SimpleChoice.No,
        title: t('poll.deny'),
        icon: simpleIcons.no,
        color: '#dcc'
      }
    ]

    if (isCombined) {
      options.push({
        value: SimpleChoice.Abstain,
        title: t('poll.abstain'),
        icon: 'block',
        color: '#999'
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

.vote-option
  text-align: center
  margin-right: .5rem
  border: 1px solid #666
  border-radius: 6px
  background-color: #eee
  display: inline-block
  label
    padding: .5rem .5rem .4rem
    display: inline-block
    cursor: pointer
    .material-icons
      vertical-align: text-bottom
      margin-right: .2rem
  input
    display: none
  &.active
    box-shadow: 1px 1px 3px inset rgba(#000, .6)
  &:last-child
    margin-right: 0
</style>
