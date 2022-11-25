<template>
  <v-row>
    <v-col offset-lg="2" lg="8">
      <header class="d-flex align-end mb-4">
        <h1 class="flex-grow-1">
          {{ t('poll.all') }}
        </h1>
        <v-btn v-if="canAddPoll" color="primary" prepend-icon="mdi-star-plus" :to="toAddPoll">
          {{ t('poll.new') }}
        </v-btn>
      </header>
      <v-divider />
      <PollList groupClass="mt-4" pollClass="my-3" v-model="pollStatesOpen">
        <template v-slot="{ empty }">
          <p v-if="empty">
            <em>{{ t('poll.noPublishedPolls') }}</em>
          </p>
        </template>
      </PollList>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'

import PollList from './PollList.vue'
import * as rules from './rules'
import { PollState } from './types'

const { t } = useI18n()
const { meeting, meetingPath } = useMeeting()
useMeetingTitle(t('poll.all'))

const pollStatesOpen = ref(history.state.pollStatesOpen as PollState[] || [PollState.Ongoing])
watch(pollStatesOpen, value => { history.replaceState({ pollStatesOpen: [...value] }, '') })

const canAddPoll = computed(() => meeting.value && rules.canAddPoll(meeting.value))
const toAddPoll = computed(() => meetingPath.value + '/polls/new')
</script>
