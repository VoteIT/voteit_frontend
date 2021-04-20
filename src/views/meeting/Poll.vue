<template>
  <main v-if="poll">
    <h1>{{ t('poll.details') }}</h1>
    <PollWidget :poll="poll" detail />
  </main>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'

import usePolls from '@/composables/meeting/usePolls'

import PollWidget from '@/components/widgets/Poll.vue'

export default defineComponent({
  name: 'PollView',
  inject: ['t'],
  components: {
    PollWidget
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
