<template>
  <div>
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk" class="mb-4">
      <template #vote>
        <div class="grade">
          <div/>
          <v-rating length="5" v-model="grades[p.pk]" active-color="success-darken-2" size="small" :disabled="disabled" />
          <div>
            <v-btn size="small" border v-show="!!grades[p.pk]" @click="grades[p.pk] = 0">{{ t('clear') }}</v-btn>
          </div>
        </div>
      </template>
    </Proposal>
    <Widget v-if="poll.settings.deny_proposal" color="warning" elevation="4" class="pa-4">
      <h2 class="text-center">
        {{ t('poll.deny') }}
      </h2>
      <div class="grade">
        <div/>
        <v-rating length="5" v-model="grades[0]" active-color="surface" size="small" :disabled="disabled" />
        <div>
          <v-btn size="small" border v-show="!!grades[0]" @click="grades[0] = 0">{{ t('clear') }}</v-btn>
        </div>
      </div>
    </Widget>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import ProposalVue from '@/modules/proposals/Proposal.vue'
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
  components: {
    Proposal: ProposalVue
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

    watch(grades, value => {
      const valid = Object.values(value).some(n => n) // Any grade set to non-zero?
      if (!valid) return emit('update:modelValue') // Clear vote on invalid
      emit('update:modelValue', {
        ranking: Object.entries(grades).map(([k, v]) => [Number(k), v])
        // ranking: proposals.value.map(p => [p.pk, grades[p.pk] ?? 0])
      })
      console.log(grades, props.modelValue)
    })

    return {
      t,
      grades,
      proposals
    }
  }
})
</script>

<style lang="sass" scoped>
.grade
  text-align: center
  display: flex
  > div
    flex: 0 1 100px
  :last-child
    text-align: right
  .v-rating
    flex: 1 0 auto
    justify-content: center
</style>
