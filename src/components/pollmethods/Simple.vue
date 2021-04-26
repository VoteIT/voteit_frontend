<template>
  <form @submit.prevent>
    <Proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:vote>
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
import { defineComponent, inject, PropType, reactive } from 'vue'
import { DefaultMap } from '@/utils'

import useMeeting from '@/composables/meeting/useMeeting'

import ProposalComponent from '../widgets/Proposal.vue'

import { CombinedSimpleVote, SimpleChoice, simpleIcons } from './types'
import { Poll, Proposal } from '@/contentTypes/types'

interface Option {
  value: SimpleChoice
  title: string
  icon: string
  color: string
}

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
      type: Object as PropType<CombinedSimpleVote>
    }
  },
  components: {
    Proposal: ProposalComponent
  },
  setup (props, { emit }) {
    const t = inject('t') as CallableFunction // TODO What?
    const { getUser } = useMeeting()
    const votes = reactive<Map<number, SimpleChoice>>(new Map())

    if (props.modelValue) {
      for (const [choice, pks] of Object.entries(props.modelValue)) {
        for (const pk of pks) {
          votes.set(pk, choice as SimpleChoice)
        }
      }
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

    if (props.proposals.length > 1) {
      options.push({
        value: SimpleChoice.Abstain,
        title: t('poll.abstain'),
        icon: simpleIcons.abstain,
        color: 'secondary'
      })
    }

    function change (proposal: Proposal, opt: Option) {
      votes.set(proposal.pk, opt.value)
      const map = new DefaultMap<SimpleChoice, number[]>(() => [])
      for (const prop of props.proposals) {
        map.get(votes.get(prop.pk) ?? SimpleChoice.Abstain).push(prop.pk)
      }
      emit('update:modelValue', Object.fromEntries(map))
    }

    // watch(() => props.modelValue, (vote?: CombinedSimpleVote) => {
    //   if (!vote) return
    //   for (const [choice, pks] of Object.entries(vote)) {
    //     for (const pk of pks) {
    //       votes.set(pk, choice as SimpleChoice)
    //     }
    //   }
    // })

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
