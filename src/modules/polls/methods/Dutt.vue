<template>
  <div>
    <v-item-group v-model="selected" multiple>
      <v-item v-for="p in proposals" :key="p.pk" :value="p.pk" v-slot="{ toggle, isSelected }">
        <Proposal readOnly :p="p" class="mb-4">
          <template #vote>
            <div class="text-center">
              <v-checkbox @update:modelValue="toggle()" :modelValue="isSelected" hide-details :label="t('select')" class="d-inline-block mb-n2" density="compact" />
            </div>
          </template>
        </Proposal>
      </v-item>
    </v-item-group>
    <v-alert v-if="validHelpText" :text="validHelpText" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'

import { DuttPoll, DuttVote } from './types'

export default defineComponent({
  name: 'ScottishSTVPoll',
  props: {
    poll: {
      type: Object as PropType<DuttPoll>,
      required: true
    },
    modelValue: Object as PropType<DuttVote>,
    disabled: Boolean
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    const selected = ref<number[]>(props.modelValue?.choices ?? [])
    const proposals = computed(() => props.poll.proposals.map(getProposal) as Proposal[])

    // eslint-disable-next-line vue/return-in-computed-property
    const missingProposals = computed(() => {
      const len = selected.value.length
      const { min } = props.poll.settings
      if (min > 0 && len < min) return min - len
    })

    // eslint-disable-next-line vue/return-in-computed-property
    const surplusProposals = computed(() => {
      const len = selected.value.length
      const { max } = props.poll.settings
      if (max > 0 && len > max) return len - max
    })

    const validVote = computed(() => {
      if (missingProposals.value || surplusProposals.value) return
      return {
        choices: selected.value
      }
    })

    watch(validVote, value => {
      emit('update:modelValue', value)
    })

    const validHelpText = computed(() => {
      if (missingProposals.value) return t('poll.dutt.minHelpText', missingProposals.value)
      if (surplusProposals.value) return t('poll.dutt.maxHelpText', surplusProposals.value)
      return t('poll.dutt.validVoteHelpText')
    })

    return {
      t,
      selected,
      proposals,
      validHelpText,
      validVote
    }
  }
})
</script>
