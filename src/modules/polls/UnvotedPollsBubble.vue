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
        :to="to" @click="$emit('update:open', false)"
      />
    </v-list>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import slugify from 'slugify'

import useMeeting from '../meetings/useMeeting'
import usePolls from './usePolls'

export default defineComponent({
  icon: 'mdi-vote',
  id: 'unvoted-polls',
  order: 0,
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'update:open', 'update:attention'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const { meeting, meetingId } = useMeeting()
    const { getNextUnvotedPoll, getUnvotedPolls } = usePolls()
    const hasUnvoted = computed(() => !!getNextUnvotedPoll(meetingId.value))

    const unvoted = computed(() => {
      return getUnvotedPolls(meetingId.value)
        .map(poll => {
          if (!meeting.value) return poll
          return {
            ...poll,
            subtitle: t('poll.pollDescription', { method: t(`poll.method.${poll.method_name}`) }, poll.proposals.length),
            to: {
              name: 'poll',
              params: {
                id: meetingId.value,
                slug: slugify(meeting.value.title),
                pid: poll.pk,
                pslug: slugify(poll.title)
              }
            }
          }
        })
    })

    watch(hasUnvoted, value => {
      emit('update:modelValue', value)
      emit('update:attention', true)
    })

    return {
      t,
      unvoted,
      close
    }
  }
})
</script>
