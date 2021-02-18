<template>
  <main v-if="meeting.pk">
    <h1>{{ meeting.title }}</h1>
    <div class="btn-controls">
      <workflow-state :admin="canChange(meeting)" :state="meeting.state" contentType="meeting" :pk="meeting.pk" />
      <btn v-if="canChange(meeting)" sm icon="edit" :active="editingBody" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
    </div>
    <richtext :object="meeting" :editing="editingBody" :api="api" @edit-done="editingBody = false" />
  </main>
</template>

<script>
import { ref } from 'vue'

import Richtext from '@/components/widgets/Richtext.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useMeeting from '@/composables/meeting/useMeeting'
import meetingType from '@/contentTypes/meeting'

export default {
  name: 'MeetingIndex',
  inject: ['t'],
  components: {
    Richtext,
    WorkflowState
  },
  setup () {
    const editingBody = ref(false)
    const api = meetingType.useContentApi()
    const { meeting } = useMeeting()

    return {
      ...meetingType.rules,
      meeting,
      editingBody,
      api
    }
  }
}
</script>
