<template>
  <header>
    <h1>{{ data.title }}</h1>
    <p class="meta">{{ t('poll.method.name') }}: {{ t(`poll.method.${data.method_name}`) }}</p>
    <!-- <div v-if="data.body" v-html="data.body" /> -->
  </header>
  <main id="voting-proposals">
    <h2 v-if="abstained">{{ t('poll.abstainRegistered') }}</h2>
    <h2 v-else-if="done">{{ t('poll.voteRegistered') }}</h2>
    <template v-else>
      <component :is="methodComponent" :poll="data" :proposals="proposals" v-model="validVote" />
      <div class="buttons btn-controls">
        <v-btn prepend-icon="mdi-vote" color="primary" :disabled="!validVote || waiting" @click="castVote()">
          {{ t('poll.castVote') }}
        </v-btn>
        <v-btn prepend-icon="mdi-cancel" color="warning" :disabled="waiting" @click="abstainVote()">
          {{ t('poll.abstain') }}
        </v-btn>
      </div>
    </template>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { socket } from '@/utils/Socket'
import useAlert from '@/composables/useAlert'

import useProposals from '../proposals/useProposals'
import { Proposal } from '../proposals/types'

import { voteType } from './contentTypes'
import usePolls from './usePolls'
import { Poll } from './types'
import { pollPlugins } from './registry'

export default defineComponent({
  name: 'VotingModal',
  props: {
    data: {
      type: Object as PropType<Poll>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getPollProposals } = useProposals()
    const { getUserVote } = usePolls()
    const { alert } = useAlert()

    const waiting = ref(false)
    const abstained = ref(false)
    const done = ref(false)

    const proposals = computed<Proposal[]>(() => getPollProposals(props.data))

    const methodPlugin = computed(() => pollPlugins.getPlugin(props.data.method_name))
    const methodComponent = computed(() => methodPlugin.value?.voteComponent)

    const userVote = getUserVote(props.data)
    const currentAbstained = ref(userVote?.abstain)
    const validVote = ref(userVote?.vote)

    async function castVote () {
      if (validVote.value) {
        waiting.value = true
        // Hopefully, some day
        // const msg = {
        //   vote,
        //   method_name: props.data.method_name
        // }
        // channels.contextAdd(props.data.pk, msg)
        const msg = {
          poll: props.data.pk,
          vote: validVote.value
        }
        try {
          await socket.call(`${props.data.method_name}_vote.add`, msg)
          done.value = true
        } catch {
          waiting.value = false
        }
      } else {
        alert(`*not implemented (value: ${validVote.value})`)
      }
    }

    function abstainVote () {
      try {
        voteType.methodCall('abstain', { poll: props.data.pk })
        abstained.value = true
      } catch {
        waiting.value = false
      }
    }

    return {
      t,
      proposals,
      methodComponent,
      waiting,
      abstained,
      done,
      validVote,
      currentAbstained,
      castVote,
      abstainVote
    }
  }
})
</script>

<style lang="sass">
#voting-proposals
  .proposal
    padding: 1em
    margin-left: -1em
    margin-right: -1em
    border-bottom: 2px solid rgb(var(--v-border-color))
  .buttons
    margin-top: 1em
    text-align: center
</style>
