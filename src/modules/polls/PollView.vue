<template>
  <v-row v-if="poll">
    <v-col offset-lg="2" lg="8">
      <header>
        <div class="header-meta">
          <span v-if="isOngoing && !canVote" class="header-tag">{{ t('poll.cantVote') }}</span>
          <WorkflowState :admin="canChange" :contentType="pollType" :object="poll" />
        </div>
        <h1>{{ poll.title }}</h1>
        <p class="text-secondary">{{ t('poll.pollDescription', { method: t(`poll.method.${poll.method_name}`), count: poll.proposals.length }) }}</p>
        <p v-if="poll.body">{{ poll.body }}</p>
        <template v-if="isOngoing">
          <v-alert type="success" v-if="votingComplete" class="mt-6">
            {{ t('poll.voteAddedInfo') }}
          </v-alert>
          <v-alert type="info" v-else class="mt-6">
            {{ t(`poll.method.help.${poll.method_name}`) }}
          </v-alert>
        </template>
      </header>
      <div v-if="isFinished" class="my-6">
        <h3>
          {{ t('poll.result.method', { method: methodName }) }}
        </h3>
        <component :is="resultComponent" :data="poll.result" class="mb-8" />
        <Dropdown v-if="poll.result.approved.length" :title="t('poll.numApproved', poll.result.approved.length )">
          <div class="proposals approved">
            <Proposal v-for="pk in poll.result.approved" :key="pk" :p="getProposal(pk)" read-only selected />
          </div>
        </Dropdown>
        <Dropdown v-if="poll.result.denied.length" :title="t('poll.numDenied', poll.result.denied.length )">
          <div class="proposals denied">
            <Proposal v-for="pk in poll.result.denied" :key="pk" :p="getProposal(pk)" read-only />
          </div>
        </Dropdown>
      </div>
      <template v-if="!votingComplete">
        <v-divider />
        <component class="voting-component" :disabled="!canVote" v-if="isOngoing" :is="voteComponent" :poll="poll" v-model="validVote" />
        <div class="btn-controls mt-6" v-if="canVote">
          <v-btn color="primary" :disabled="!validVote || submitting" @click="castVote()" size="large" prepend-icon="mdi-vote">
            {{ t('poll.vote') }}
          </v-btn>
          <v-btn color="warning" :disabled="submitting" @click="abstainVote()" prepend-icon="mdi-cancel">
            {{ t('poll.abstain') }}
          </v-btn>
        </div>
      </template>
      <div class="btn-controls mt-6">
        <v-btn v-for="{ props, title } in buttons" :key="title" v-bind="props">
          {{ title }}
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import WorkflowState from '@/components/WorkflowState.vue'
import Channel from '@/contentTypes/Channel'
import useMeeting from '@/modules/meetings/useMeeting'
import useProposals from '../proposals/useProposals'
import Proposal from '../proposals/Proposal.vue'

import usePoll from './usePoll'
import { pollType } from './contentTypes'
import { ThemeColor } from '@/utils/types'
import slugify from 'slugify'

export default defineComponent({
  name: 'PollView',
  components: {
    WorkflowState,
    Proposal
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { getProposal } = useProposals()
    const { poll, isOngoing, isFinished, userVote, canChange, canVote, voteComponent, resultComponent, nextUnvoted } = usePoll(computed(() => Number(route.params.pid)))
    const { meetingPath } = useMeeting()
    const channels = new Channel('vote')

    const validVote = ref(userVote.value?.vote) // Gets updates from method vote component, when valid.
    const votingComplete = ref(!!userVote.value)
    watch(poll, () => {
      votingComplete.value = !!userVote.value
      validVote.value = userVote.value?.vote
    })

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
    const buttons = computed(() => {
      const btns: { props: object, title: string }[] = [{
        props: {
          color: ThemeColor.Primary,
          to: `${meetingPath.value}/polls`,
          prependIcon: 'mdi-chevron-double-left'
        },
        title: t('poll.all')
      }]
      if (votingComplete.value && canVote.value) {
        btns.push({
          props: {
            color: ThemeColor.Secondary,
            onClick: () => { votingComplete.value = false },
            prependIcon: 'mdi-vote'
          },
          title: t('poll.viewAndChangeVote')
        })
      }
      if (nextUnvoted.value) {
        btns.push({
          props: {
            color: ThemeColor.Accent,
            to: `${meetingPath.value}/polls/${nextUnvoted.value.pk}/${slugify(nextUnvoted.value.title)}`,
            prependIcon: 'mdi-star'
          },
          title: t('poll.nextUnvoted', nextUnvoted.value as {})
        })
      }
      return btns
    })
    const methodName = computed(() => poll.value && t(`poll.method.${poll.value.method_name}`))

    return {
      t,
      allPollsPath,
      buttons,
      canChange,
      canVote,
      methodName,
      poll,
      pollType,
      resultComponent,
      isOngoing,
      isFinished,
      validVote,
      voteComponent,
      submitting,
      votingComplete,
      abstainVote,
      castVote,
      getProposal
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
