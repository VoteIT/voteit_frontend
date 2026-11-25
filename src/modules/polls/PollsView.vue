<script lang="ts" setup>
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'

import PollList from './PollList.vue'
import * as rules from './rules'
import { PollState } from './types'
import MeetingToolbar from '../meetings/MeetingToolbar.vue'

const { t } = useI18n()
const { meeting } = useMeeting()
useMeetingTitle(t('poll.all'))

const pollStatesOpen = shallowRef(
  (history.state.pollStatesOpen as PollState[]) || [PollState.Ongoing]
)
watch(pollStatesOpen, (value) => {
  history.replaceState({ ...history.state, pollStatesOpen: [...value] }, '')
})

const canAddPoll = computed(
  () => meeting.value && rules.canAddPoll(meeting.value)
)
</script>

<template>
  <MeetingToolbar :title="$t('poll.all')">
    <v-btn
      v-if="canAddPoll"
      color="primary"
      prepend-icon="mdi-star-plus"
      :text="$t('poll.new')"
      :to="{ name: 'pollStart' }"
    />
  </MeetingToolbar>
  <v-row>
    <v-col offset-lg="2" lg="8">
      <PollList class="ga-4" :poll-gap="3" v-model="pollStatesOpen">
        <template #empty>
          <p class="text-center text-medium-emphasis">
            <em>{{ $t('poll.noPublishedPolls') }}</em>
          </p>
        </template>
      </PollList>
    </v-col>
  </v-row>
</template>
