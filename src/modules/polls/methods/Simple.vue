<template>
  <form @submit.prevent class="my-4">
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="simple-options">
          <Btn :disabled="disabled" v-for="opt in options" :key="opt.value" :color="opt.color" :variant="opt.value === votes.get(p.pk) ? 'contained' : 'outlined'" :icon="opt.icon" @click="change(p, opt)">
            {{ t(opt.translationString) }}
          </Btn>
        </div>
      </template>
    </Proposal>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { DefaultMap } from '@/utils'

import ProposalVue from '@/modules/proposals/Proposal.vue'
import { Proposal } from '@/modules/proposals/types'

import { SimpleVote, SimpleChoice, SimpleChoiceDesc, simpleChoices, SimplePoll } from './types'
import usePoll from '../usePoll'

export default defineComponent({
  name: 'SimplePoll',
  props: {
    poll: {
      type: Object as PropType<SimplePoll>,
      required: true
    },
    modelValue: {
      type: Object as PropType<SimpleVote>
    },
    disabled: Boolean
  },
  components: {
    Proposal: ProposalVue
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { proposals } = usePoll(computed(() => props.poll.pk))
    const votes = reactive<Map<number, SimpleChoice>>(new Map())

    if (props.modelValue) {
      for (const [choice, pks] of Object.entries(props.modelValue)) {
        for (const pk of pks) {
          votes.set(pk, choice as SimpleChoice)
        }
      }
    }

    const options = proposals.value.length > 1 ? simpleChoices : simpleChoices.filter(c => c.value !== SimpleChoice.Abstain)

    function change (proposal: Proposal, opt: SimpleChoiceDesc) {
      if (props.disabled) return
      votes.set(proposal.pk, opt.value)
      const map = new DefaultMap<SimpleChoice, number[]>(() => [])
      for (const prop of proposals.value) {
        map.get(votes.get(prop.pk) ?? SimpleChoice.Abstain).push(prop.pk)
      }
      emit('update:modelValue', Object.fromEntries(map))
    }

    return {
      t,
      votes,
      options,
      proposals,
      change
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
