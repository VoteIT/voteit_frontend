<template>
  <div>
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="text-center">
          <v-rating :length="stars" clearable v-model="grades[p.pk]" active-color="success" :size="stars > 8 ? 'x-small' : 'small'" :disabled="disabled" class="flex-wrap justify-center" />
        </div>
      </template>
    </Proposal>
    <Widget v-if="poll.settings.deny_proposal" color="warning" elevation="4" class="pa-4">
      <h2 class="text-center">
        {{ t('poll.deny') }}
      </h2>
      <div class="text-center">
        <v-rating :length="stars" clearable v-model="grades[0]" active-color="surface" size="small" :disabled="disabled" class="flex-wrap justify-center" />
      </div>
    </Widget>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'

import { SchulzePoll, SchulzeVote } from './types'

export default defineComponent({
  name: 'SchulzePoll',
  props: {
    poll: {
      type: Object as PropType<SchulzePoll>,
      required: true
    },
    modelValue: Object as PropType<SchulzeVote>,
    disabled: Boolean
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    function getGrades () {
      if (props.modelValue) return Object.fromEntries(props.modelValue.ranking)
      const deny = props.poll.settings.deny_proposal ? [0] : []
      return Object.fromEntries([...props.poll.proposals, ...deny].map(id => [id, 0]))
    }

    const grades = reactive<Record<number, number>>(getGrades())
    // if (props.modelValue) {
    //   for (const [key, value] of props.modelValue.ranking) {
    //     grades[key] = value
    //   }
    // }

    const proposals = computed(() => props.poll.proposals.map(getProposal) as Proposal[])
    const stars = computed(() => props.poll.settings?.stars ?? 5)

    watch(grades, value => {
      const valid = Object.values(value).some(n => n) // Any grade set to non-zero?
      if (!valid) return emit('update:modelValue') // Clear vote on invalid
      emit('update:modelValue', {
        ranking: Object.entries(grades).map(([k, v]) => [Number(k), v])
      })
    })

    return {
      t,
      grades,
      proposals,
      stars
    }
  }
})
</script>
