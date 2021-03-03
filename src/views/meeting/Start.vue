<template>
  <main v-if="meeting.pk">
    <h1>{{ meeting.title }}</h1>
    <div class="btn-controls">
      <WorkflowState :admin="canChange(meeting)" :state="meeting.state" :contentType="meetingType" :pk="meeting.pk" />
      <btn v-if="canChange(meeting)" sm icon="edit" :active="editingBody" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
    </div>
    <Richtext :object="meeting" :editing="editingBody" :api="api" @edit-done="editingBody = false" />
  </main>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import Richtext from '@/components/widgets/Richtext.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useMeeting from '@/composables/meeting/useMeeting'
import meetingType from '@/contentTypes/meeting'

export default defineComponent({
  name: 'MeetingIndex',
  inject: ['t'],
  components: {
    Richtext,
    WorkflowState
  },
  setup () {
    const editingBody = ref(false)
    const api = meetingType.getContentApi()
    const { meeting } = useMeeting()

    return {
      meetingType,
      ...meetingType.rules,
      meeting,
      editingBody,
      api
    }
  }
})
</script>
