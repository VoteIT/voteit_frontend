<template>
  <form @submit.prevent>
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:vote>
        <div class="simple-options">
          <Btn :disabled="disabled" v-for="opt in options" :key="opt.value" :color="opt.color" :variant="opt.value === votes.get(p.pk) ? 'contained' : 'outlined'" :icon="opt.icon" @click="change(p, opt)">
            {{ opt.title }}
          </Btn>
        </div>
      </template>
    </Proposal>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue'
import { DefaultMap } from '@/utils'

import useMeeting from '@/modules/meetings/useMeeting'
import useProposals from '@/modules/proposals/useProposals'

import ProposalComponent from '@/modules/proposals/Proposal.vue'

import { CombinedSimpleVote, SimpleChoice, simpleIcons } from './types'
import { Poll, Proposal } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'

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
    modelValue: {
      type: Object as PropType<CombinedSimpleVote>
    },
    disabled: Boolean
  },
  components: {
    Proposal: ProposalComponent
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { getProposal } = useProposals()
    const { getUser } = useMeeting()
    const votes = reactive<Map<number, SimpleChoice>>(new Map())

    if (props.modelValue) {
      for (const [choice, pks] of Object.entries(props.modelValue)) {
        for (const pk of pks) {
          votes.set(pk, choice as SimpleChoice)
        }
      }
    }

    const options: Option[] = [
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

    const proposals = computed(() => props.poll.proposals.map(getProposal) as Proposal[])

    if (proposals.value.length > 1) {
      options.push({
        value: SimpleChoice.Abstain,
        title: t('poll.abstain'),
        icon: simpleIcons.abstain,
        color: 'secondary'
      })
    }

    function change (proposal: Proposal, opt: Option) {
      if (props.disabled) return
      votes.set(proposal.pk, opt.value)
      const map = new DefaultMap<SimpleChoice, number[]>(() => [])
      for (const prop of proposals.value) {
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
      getUser,
      votes,
      options,
      proposals
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
