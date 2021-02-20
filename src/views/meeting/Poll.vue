<template>
  <main v-if="poll">
    <h1>{{ t('poll.details') }}</h1>
    <poll-detail :poll="poll"/>
  </main>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import usePolls from '@/composables/meeting/usePolls'

import PollDetail from '@/components/widgets/Poll'

export default {
  name: 'PollView',
  inject: ['t'],
  components: {
    PollDetail
  },
  setup () {
    const route = useRoute()
    const { getPoll } = usePolls()

    const poll = computed(_ => getPoll(Number(route.params.pid)))

    return {
      poll
    }
  }
}
</script>
