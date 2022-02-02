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
        :to="to" @click="$emit('close')"
      />
    </v-list>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import slugify from 'slugify'

import useMeeting from '../meetings/useMeeting'
import usePolls from './usePolls'

export default defineComponent({
  icon: 'mdi-vote',
  id: 'unvoted-polls',
  emits: ['close'],
  setup () {
    const { t } = useI18n()
    const { meeting } = useMeeting()
    const { getUnvotedPolls } = usePolls()
    const unvoted = computed(() => {
      if (!meeting.value) return []
      return getUnvotedPolls(meeting.value.pk)
        .map(poll => {
          if (!meeting.value) return {}
          return {
            ...poll,
            subtitle: t('poll.pollDescription', { method: t(`poll.method.${poll.method_name}`) }, poll.proposals.length),
            to: {
              name: 'poll',
              params: {
                id: meeting.value.pk,
                slug: slugify(meeting.value.title),
                pid: poll.pk,
                pslug: slugify(poll.title)
              }
            }
          }
        })
    })

    return {
      t,
      unvoted,
      close
    }
  }
})
</script>
