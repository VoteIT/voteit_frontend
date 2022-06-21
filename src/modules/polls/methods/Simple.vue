<template>
  <form @submit.prevent class="my-4">
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="simple-options">
          <v-btn :disabled="disabled" v-for="opt in options" :key="opt.value" :color="opt.color" :variant="opt.value === votes.get(p.pk) ? 'elevated' : 'outlined'" :prepend-icon="opt.icon" @click="change(p, opt)">
            {{ t(opt.translationString) }}
          </v-btn>
        </div>
      </template>
    </Proposal>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { Proposal } from '@/modules/proposals/types'

import { SimpleVote, SimpleChoice, SimpleChoiceDesc, simpleChoices, SimplePoll } from './types'
import usePoll from '../usePoll'
import DefaultMap from '@/utils/DefaultMap'

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

    const validVote = computed(() => {
      // Return a valid vote, or undefined if not valid
      const map = new DefaultMap<SimpleChoice, number[]>(() => [])
      for (const prop of proposals.value) {
        const vote = votes.get(prop.pk)
        if (!vote) return
        map.get(vote).push(prop.pk)
      }
      return Object.fromEntries(map)
    })

    function change (proposal: Proposal, opt: SimpleChoiceDesc) {
      if (props.disabled) return
      votes.set(proposal.pk, opt.value)
      emit('update:modelValue', validVote.value)
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
