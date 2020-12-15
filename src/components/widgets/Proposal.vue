<template>
  <div>
    {{ getUser(p.author, meetingId).full_name }} {{ p.pk }}<br />
    {{ p.title }}
    <div v-if="hasRole('moderator')">
      <span class="btn-group">
        <workflow-state admin :state="p.state" :all-states="wfStates" :endpoint="`proposals/${p.pk}/`" />
      </span>
      <btn icon="delete" sm @click="$api.delete(`proposals/${p.pk}/`)" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

import WorkflowState from './WorkflowState.vue'

import useMeeting from '../../composables/meeting/useMeeting.js'
import useMeetingRoles from '../../composables/meeting/useMeetingRoles.js'

import proposalStates from '../../schemas/proposalStates.json'

export default {
  name: 'Proposal',
  setup () {
    const wfStates = computed(_ => proposalStates)
    return {
      wfStates,
      ...useMeeting(),
      ...useMeetingRoles()
    }
  },
  props: {
    p: Object
  },
  components: {
    WorkflowState
  }
}
</script>
