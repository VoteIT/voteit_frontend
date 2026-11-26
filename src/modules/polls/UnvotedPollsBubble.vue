<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { slugify } from '@/utils'

import BubbleHeader from '../meetings/BubbleHeader.vue'
import useMeeting from '../meetings/useMeeting'
import usePollStore from './usePollStore'
import { pollPlugins } from './registry'

const open = defineModel<boolean>()

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { getUnvotedPolls } = usePollStore()

const unvoted = computed(() => {
  return getUnvotedPolls(meetingId.value).map((poll) => ({
    ...poll,
    subtitle: t(
      'poll.pollDescription',
      { method: pollPlugins.getName(poll.method_name, t) },
      poll.proposals.length
    ),
    to: {
      name: 'poll',
      params: {
        id: meetingId.value,
        slug: slugify(meeting.value?.title),
        pid: poll.pk,
        pslug: slugify(poll.title)
      }
    }
  }))
})
</script>

<template>
  <BubbleHeader
    icon="mdi-vote"
    :title="$t('poll.timeToVote')"
    :subtitle="$t('poll.timeToVoteDescription', unvoted.length)"
  />
  <v-list class="mx-n2 mb-n3">
    <v-list-item
      v-for="{ pk, title, subtitle, to } in unvoted"
      :key="pk"
      append-icon="mdi-chevron-right"
      :title="title"
      :subtitle="subtitle"
      :to="to"
      @click="open = false"
    />
  </v-list>
</template>
