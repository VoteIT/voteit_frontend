<template>
  <main v-if="meeting">
    <Menu float :items="menuItems" />
    <h1>{{ meeting.title }}</h1>
    <WorkflowState :admin="canChange(meeting)" :content-type="meetingType" :object="meeting" />
    <Richtext :object="meeting" :editing="editingBody" :api="api" @edit-done="editingBody = false" />
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import Richtext from '@/components/widgets/Richtext.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useMeeting from '@/composables/meeting/useMeeting'
import meetingType from '@/contentTypes/meeting'
import { useI18n } from 'vue-i18n'
import { MenuItem } from '@/utils/types'

export default defineComponent({
  name: 'MeetingIndex',
  inject: ['t'],
  components: {
    Richtext,
    WorkflowState
  },
  setup () {
    const { t } = useI18n()
    const editingBody = ref(false)
    const api = meetingType.getContentApi()
    const { meeting } = useMeeting()

    const menuItems = computed<MenuItem[]>(() => {
      if (!meetingType.rules.canChange(meeting.value)) return []
      return [{
        text: t('edit'),
        icon: 'mdi-pencil',
        onClick: async () => { editingBody.value = true }
      }]
    })

    return {
      meetingType,
      ...meetingType.rules,
      meeting,
      menuItems,
      editingBody,
      api
    }
  }
})
</script>
