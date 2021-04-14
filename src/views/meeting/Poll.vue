<template>
  <v-container v-if="poll">
    <h1>{{ t('poll.details') }}</h1>
    <poll-detail :poll="poll"/>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'

import usePolls from '@/composables/meeting/usePolls'

import PollDetail from '@/components/widgets/Poll.vue'

export default defineComponent({
  name: 'PollView',
  inject: ['t'],
  components: {
    PollDetail
  },
  setup () {
    const route = useRoute()
    const { getPoll } = usePolls()

    const poll = computed(() => getPoll(Number(route.params.pid)))

    return {
      poll
    }
  }
})
</script>
