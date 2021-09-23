<template>
  <v-row v-if="poll">
    <v-col offset-lg="2" lg="8">
      <header>
        <div class="header-meta">
          <span v-if="isOngoing(poll) && !canVote(poll)" class="header-tag">{{ t('poll.cantVote') }}</span>
          <WorkflowState :admin="canChange(poll)" :contentType="pollType" :object="poll" />
        </div>
        <h1>{{ poll.title }}</h1>
        <p class="text-secondary">{{ t('poll.method.name') }}: {{ t(`poll.method.${poll.method_name}`) }}</p>
        <p v-if="poll.body">{{ poll.body }}</p>
        <v-alert type="success" v-if="votingComplete" class="mt-6">
          {{ t('poll.voteAddedInfo') }}
        </v-alert>
        <v-alert type="info" v-else class="mt-6">
          {{ t(`poll.method.help.${poll.method_name}`) }}
        </v-alert>
      </header>
      <template v-if="votingComplete">
        <div class="btn-controls mt-6" v-if="canVote(poll)">
          <v-btn color="primary" prepend-icon="mdi-chevron-left" @click="$router.push(allPollsPath)">
            {{ t('poll.all') }}
          </v-btn>
          <v-btn color="secondary" @click="votingComplete = false" prepend-icon="mdi-vote">
            {{ t('poll.viewAndChangeVote') }}
          </v-btn>
        </div>
      </template>
      <template v-else>
        <v-divider />
        <component class="voting-component" :disabled="!canVote(poll)" v-if="isOngoing(poll)" :is="voteComponent" :poll="poll" v-model="validVote" />
        <div class="btn-controls mt-6" v-if="canVote(poll)">
          <v-btn color="primary" :disabled="!validVote || submitting" @click="castVote()" size="large" prepend-icon="mdi-vote">
            {{ t('poll.vote') }}
          </v-btn>
          <v-btn color="warning" :disabled="submitting" @click="abstainVote()" prepend-icon="mdi-cancel">
            {{ t('poll.abstain') }}
          </v-btn>
        </div>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import usePolls from '@/modules/polls/usePolls'

import pollType from '@/contentTypes/poll'

import WorkflowState from '@/components/WorkflowState.vue'
import Channel from '@/contentTypes/Channel'
import useMeeting from '@/modules/meetings/useMeeting'

import { pollMethods } from './methods'

export default defineComponent({
  name: 'PollView',
  components: {
    WorkflowState
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getPoll, getUserVote } = usePolls()
    const { meetingPath } = useMeeting()
    const channels = new Channel('vote')

    const poll = computed(() => getPoll(Number(route.params.pid)))
    const userVote = computed(() => poll.value && getUserVote(poll.value))
    const validVote = ref(userVote.value?.vote) // Gets updates from method vote component, when valid.
    const votingComplete = ref(!!userVote.value)
    watch(poll, () => {
      votingComplete.value = !!userVote.value
      validVote.value = userVote.value?.vote
    })

    const voteComponent = computed(() => poll.value && pollMethods[poll.value.method_name])

    const submitting = ref(false)
    async function castVote () {
      if (!validVote.value || !poll.value) return
      submitting.value = true
      // Hopefully, some day
      // const msg = {
      //   vote,
      //   method_name: props.data.method_name
      // }
      // channels.contextAdd(props.data.pk, msg)
      const msg = {
        poll: poll.value.pk,
        vote: validVote.value
      }
      try {
        await channels.post(`${poll.value.method_name}_vote.add`, msg)
        votingComplete.value = true
      } catch {}
      submitting.value = false
    }

    async function abstainVote () {
      if (!poll.value) return
      submitting.value = true
      try {
        await channels.post('vote.abstain', { poll: poll.value.pk })
        votingComplete.value = true
        validVote.value = undefined // Forget vote
      } catch {}
      submitting.value = false
    }

    const allPollsPath = computed(() => `${meetingPath.value}/polls`)

    return {
      t,
      allPollsPath,
      poll,
      pollType,
      ...pollType.rules,
      validVote,
      voteComponent,
      abstainVote,
      castVote,
      submitting,
      votingComplete
    }
  }
})
</script>

<style lang="sass">
header .header-tag
  margin-right: 1em
  font-size: 9pt
  font-weight: 500
  text-transform: uppercase
  letter-spacing: .03em
  padding: 0 .6em
  color: rgba(var(--v-theme-on-background), .6)
  border: 2px solid rgba(var(--v-border-color), .6)
  border-radius: 4px

.voting-component
  .proposal
    padding: 2em 0
    border-bottom: 2px solid rgb(var(--v-border-color))
</style>
