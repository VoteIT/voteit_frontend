<template>
  <v-row v-if="poll">
    <v-col offset-lg="2" lg="8">
      <header>
        <header class="d-flex">
          <div class="flex-grow-1">
            <span v-if="isOngoing && !canVote" class="header-tag">{{ t('poll.cantVote') }}</span>
            <WorkflowState :admin="canChange" :contentType="pollType" :object="poll" />
            <h1>{{ poll.title }}</h1>
            <p class="text-secondary">{{ t('poll.pollDescription', { method: t(`poll.method.${poll.method_name}`), count: poll.proposals.length }) }}</p>
          </div>
          <Menu :items="menuItems" />
        </header>
        <p v-if="poll.body">{{ poll.body }}</p>
        <template v-if="isOngoing">
          <v-alert type="success" v-if="votingComplete" class="my-6">
            {{ t('poll.voteAddedInfo') }}
          </v-alert>
          <v-alert type="info" v-else class="my-6">
            {{ t(`poll.method.help.${poll.method_name}`) }}
          </v-alert>
        </template>
      </header>
      <div v-if="isFinished" id="poll-results" class="my-6">
        <ProgressBar class="my-4" :text="t('poll.finalVoteCount', voteCount)" :value="voteCount.voted" :total="voteCount.total" />
        <h3>
          {{ t('poll.result.method', { method: methodName }) }}
        </h3>
        <component :is="resultComponent" :result="poll.result" :abstainCount="poll.abstain_count" class="mb-8" />
        <Dropdown v-if="approved.length" :title="t('poll.numApproved', approved.length )">
          <div class="proposals approved mb-4">
            <Proposal v-for="p in approved" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
        <Dropdown v-if="denied.length" :title="t('poll.numDenied', denied.length )">
          <div class="proposals denied mb-4">
            <Proposal v-for="p in denied" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
      </div>
      <template v-if="!votingComplete">
        <v-divider />
        <component class="voting-component" :disabled="!canVote" v-if="isOngoing" :is="voteComponent" :poll="poll" v-model="validVote" />
        <div class="btn-controls mt-6" v-if="canVote">
          <v-btn color="primary" size="large" :disabled="!validVote || submitting" @click="castVote()" prepend-icon="mdi-vote">
            {{ t('poll.vote') }}
          </v-btn>
          <v-btn color="warning" :disabled="submitting" @click="abstainVote()" prepend-icon="mdi-cancel">
            {{ t('poll.abstain') }}
          </v-btn>
        </div>
      </template>
      <div class="mt-6">
        <v-btn v-for="{ props, title } in buttons" :key="title" v-bind="props" class="mr-1 mb-1">
          {{ title }}
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import WorkflowState from '@/components/WorkflowState.vue'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useMeeting from '../meetings/useMeeting'
import Proposal from '../proposals/Proposal.vue'

import usePoll from './usePoll'
import { pollType, voteType } from './contentTypes'
import { MenuItem, ThemeColor } from '@/utils/types'
import { dialogQuery, slugify } from '@/utils'
import { parseSocketError, socket } from '@/utils/Socket'

export default defineComponent({
  name: 'PollView',
  components: {
    WorkflowState,
    Proposal
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const { approved, denied, poll, isOngoing, isFinished, userVote, canChange, canDelete, canVote, voteComponent, resultComponent, nextUnvoted, voteCount } = usePoll(computed(() => Number(route.params.pid)))
    const { meetingPath, meetingId } = useMeeting()
    useMeetingTitle(computed(() => poll.value?.title ?? t('poll.polls')))

    const validVote = ref(userVote.value?.vote) // Gets updates from method vote component, when valid.
    const votingComplete = ref(!!userVote.value)
    watch(poll, () => {
      // votingComplete.value = !!userVote.value
      validVote.value = userVote.value?.vote
    })
    watch(userVote, (value) => {
      if (!value) return
      validVote.value = value.vote
    })

    const submitting = ref(false)
    async function castVote () {
      if (!validVote.value || !poll.value) return
      submitting.value = true
      const msg = {
        poll: poll.value.pk,
        vote: validVote.value
      }
      try {
        await socket.call(`${poll.value.method_name}_vote.add`, msg, { alertOnError: true })
        votingComplete.value = true
      } catch (e) {
        // TODO
        console.error(parseSocketError(e as Error))
      }
      submitting.value = false
    }

    async function abstainVote () {
      if (!poll.value) return
      if (validVote.value) {
        if (!await dialogQuery({
          title: t('poll.abstainValidVoteConfirm'),
          no: t('cancel'),
          yes: t('poll.abstain'),
          theme: ThemeColor.Warning
        })) {
          return
        }
      }
      submitting.value = true
      try {
        await voteType.methodCall('abstain', { poll: poll.value.pk })
        votingComplete.value = true
        validVote.value = undefined // Forget vote
      } catch (e) {
        // TODO
        console.error(parseSocketError(e as Error))
      }
      submitting.value = false
    }

    async function deletePoll () {
      if (!canDelete.value || !poll.value) return
      if (!await dialogQuery({
        title: t('poll.confirmDeleteQuery'),
        theme: ThemeColor.Warning
      })) return
      await pollType.api.delete(poll.value.pk)
      router.push({
        name: 'polls',
        params: { id: meetingId.value }
      })
    }

    const menuItems = computed<MenuItem[]>(() => {
      if (!canDelete.value) return []
      return [{
        title: t('delete'),
        icon: 'mdi-delete',
        color: ThemeColor.Warning,
        onClick: deletePoll
      }]
    })

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
            color: ThemeColor.Primary,
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
      approved,
      buttons,
      canChange,
      canVote,
      denied,
      menuItems,
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
      voteCount,
      abstainVote,
      castVote
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

#poll-results
  .proposals
    display: flex
    margin: -10px
    flex-flow: wrap
    > *
      margin: 10px
      flex: 0 1 calc(50% - 20px)
</style>
