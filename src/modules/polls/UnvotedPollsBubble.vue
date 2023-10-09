<template>
  <div>
    <h2>
      {{ t('poll.timeToVote') }}
    </h2>
    <p class="mb-2">
      {{ t('poll.timeToVoteDescription', unvoted.length) }}
    </p>
    <v-list>
      <v-list-item
        active color="primary" class="mt-1"
        v-for="{ pk, title, subtitle, to } in unvoted" :key="pk"
        append-icon="mdi-chevron-right"
        :title="title" :subtitle="subtitle"
        :to="to" @click="$emit('update:modelValue', false)"
      />
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { slugify } from '@/utils'

import useMeeting from '../meetings/useMeeting'
import usePolls from './usePolls'
import { pollPlugins } from './registry'

defineProps<{ modelValue?: boolean }>()
defineEmits(['update:modelValue'])

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { getUnvotedPolls } = usePolls()

const unvoted = computed(() => {
  return getUnvotedPolls(meetingId.value)
    .map(poll => ({
      ...poll,
      subtitle: t('poll.pollDescription', { method: pollPlugins.getName(poll.method_name, t) }, poll.proposals.length),
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
