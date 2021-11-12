<template>
  <form @submit.prevent class="my-4">
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="text-center">
          <Btn :disabled="disabled" :color="option.color" :variant="choice === p.pk ? 'contained' : 'outlined'" :icon="option.icon" @click="select(p)">
            {{ t(option.translationString) }}
          </Btn>
        </div>
      </template>
    </Proposal>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ProposalVue from '@/modules/proposals/Proposal.vue'
import { Proposal } from '@/modules/proposals/types'

import { MajorityVote, SimpleChoice, simpleChoices, SimplePoll } from './types'
import usePoll from '../usePoll'

export default defineComponent({
  name: 'SimplePoll',
  props: {
    poll: {
      type: Object as PropType<SimplePoll>,
      required: true
    },
    modelValue: {
      type: Object as PropType<MajorityVote>
    },
    disabled: Boolean
  },
  components: {
    Proposal: ProposalVue
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { proposals } = usePoll(computed(() => props.poll.pk))
    const choice = ref<number | undefined>(props.modelValue?.choice)

    const option = simpleChoices.find(c => c.value === SimpleChoice.Yes)

    function select (proposal: Proposal) {
      if (props.disabled) return
      choice.value = proposal.pk
      emit('update:modelValue', { choice: choice.value })
    }

    return {
      t,
      choice,
      option,
      proposals,
      select
    }
  }
})
</script>
