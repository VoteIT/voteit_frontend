<template>
  <div class="poll">
    <div class="head">
      <h2>{{ poll.title }}</h2>
      <workflow-state :state="poll.state" :admin="canChange(poll)" content-type="poll" :pk="poll.pk" />
    </div>
    <div class="body">
      <btn @click="vote" icon="ballot" v-if="canVote(poll)">{{ t('poll.vote') }}</btn>
      <p v-if="poll.state === 'finished'">
        {{ poll.result_data }}
      </p>
      <p v-else>
        Other poll info ...
      </p>
      <btn-dropdown dark class="voting-info" v-if="isOngoing" title="Watch voting" @open="active=true" @close="active=false">
        <progress-bar v-if="poll" absolute :value="poll.voted" :total="poll.total" />
        <p v-else>{{ t('loader.loading') }}...</p>
      </btn-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onBeforeUnmount, PropType, ref, watch } from 'vue'

import useModal from '@/composables/useModal'

import WorkflowState from '@/components/widgets/WorkflowState.vue'
import BtnDropdown from '@/components/BtnDropdown.vue'
import Voting from '@/components/modals/Voting.vue'

import pollType from '@/contentTypes/poll'
import { Poll } from '@/contentTypes/types'

export default defineComponent({
  name: 'Poll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    }
  },
  components: {
    WorkflowState,
    BtnDropdown
  },
  setup (props) {
    const channels = pollType.useChannels()
    const { openModal } = useModal()
    const isOngoing = computed(() => props.poll.state === 'ongoing')

    const t = inject('t') as CallableFunction

    function vote () {
      openModal({
        title: t('poll.votingTitle', props.poll),
        component: Voting,
        data: props.poll
      })
    }

    // Toggle active listens to ongoing poll statuses
    const active = ref(false)
    watch(active, value => {
      if (value) {
        channels.subscribe(props.poll.pk)
      } else {
        channels.leave(props.poll.pk)
      }
    })

    onBeforeUnmount(() => {
      if (active.value) {
        channels.leave(props.poll.pk)
      }
    })

    return {
      ...pollType.rules,
      isOngoing,
      active,
      vote,
      t
    }
  }
})
</script>

<style lang="sass">
div.poll
  background-color: #eee
  padding: .5rem
  border-radius: 6px
  margin: 1rem 0

  .head
    display: flex
    h2
      margin: 0
      flex: 1 0 auto
      text-decoration: none

  .body
    padding-top: 1rem

body.no-scroll
  overflow: hidden
</style>
