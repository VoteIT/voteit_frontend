<template>
  <main>
    <h1>{{ meeting.title }}</h1>
    <div class="btn-controls" v-if="meeting.pk">
      <workflow-state :admin="hasRole('moderator')" :state="meeting.state" contentType="meeting" :pk="meeting.pk" />
      <btn sm icon="edit" :active="editingBody" @click="editingBody = !editingBody" />
    </div>
    <richtext :key="`meeting/${meeting.pk}`" :object="meeting" :editing="editingBody" :api="api" @edit-done="editingBody = false" />
  </main>
</template>

<script>
import { ref } from 'vue'

import Richtext from '@/components/widgets/Richtext.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useContentApi from '@/composables/useContentApi'
import useMeeting from '@/composables/meeting/useMeeting.js'

import meetingStates from '@/schemas/meetingStates'

export default {
  name: 'MeetingIndex',
  components: {
    Richtext,
    WorkflowState
  },
  setup () {
    const editingBody = ref(false)
    const api = useContentApi('meeting')
    const { meeting, hasRole } = useMeeting()

    return {
      meeting,
      editingBody,
      api,
      hasRole,
      meetingStates
    }
  }
}
</script>
