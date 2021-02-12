<template>
  <main>
    <h1>{{ meeting.title }}</h1>
    <div class="btn-controls" v-if="meeting.pk">
      <workflow-state :admin="hasRole('moderator')" :state="meeting.state" contentType="meeting" :pk="meeting.pk" />
      <btn v-if="hasRole('moderator')" sm icon="edit" :active="editingBody" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
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

export default {
  name: 'MeetingIndex',
  inject: ['t'],
  components: {
    Richtext,
    WorkflowState
  },
  setup () {
    const editingBody = ref(false)
    const api = useContentApi('meeting')
    const { meeting, hasRole } = useMeeting()

    return {
      hasRole,
      meeting,
      editingBody,
      api
    }
  }
}
</script>
