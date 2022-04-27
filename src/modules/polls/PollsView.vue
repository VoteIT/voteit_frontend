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
      <PollList groupClass="mt-4">
        <template v-slot="{ empty }">
          <p v-if="empty">
            <em>{{ t('poll.noPublishedPolls') }}</em>
          </p>
        </template>
      </PollList>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'

import PollList from './PollList.vue'
import { canAddPoll } from './rules'

export default defineComponent({
  components: {
    PollList
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingPath } = useMeeting()
    useMeetingTitle(t('poll.all'))

    return {
      t,
      canAddPoll: computed(() => meeting.value && canAddPoll(meeting.value)),
      toAddPoll: computed(() => meetingPath.value + '/polls/new')
    }
  }
})
</script>
