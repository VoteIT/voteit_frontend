<template>
  <v-row v-if="meeting">
    <v-col lg="8" offset-lg="2">
      <header>
        <Menu float :items="menuItems" />
        <WorkflowState :admin="canChange" :contentType="meetingType" :object="meeting" />
        <Headline v-model="content.title" :editing="editing" @edit-done="submit()" />
      </header>
      <Richtext v-model="content.body" :editing="editing" @edit-done="submit()" variant="full" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import { MenuItem } from '@/utils/types'
import { useTitle } from '@vueuse/core'
import { meetingType } from './contentTypes'

export default defineComponent({
  name: 'MeetingIndex',
  components: {
    Richtext,
    WorkflowState,
    Headline
  },
  setup () {
    const { t } = useI18n()
    const editing = ref(false)
    const { meeting, meetingId, canChange } = useMeeting()

    useTitle(computed(() => `${meeting.value?.title} | VoteIT`))

    const content = reactive({
      title: meeting.value?.title ?? '',
      body: meeting.value?.body ?? ''
    })
    watch(meeting, value => {
      if (editing.value) return
      content.title = value?.title ?? ''
      content.body = value?.body ?? ''
    })

    const menuItems = computed<MenuItem[]>(() => {
      if (!canChange) return []
      return [{
        title: t('edit'),
        icon: 'mdi-pencil',
        onClick: async () => { editing.value = true }
      }]
    })

    function submit () {
      editing.value = false
      if (content.title === meeting.value?.title && content.body === meeting.value?.body) return
      meetingType.api.patch(meetingId.value, { ...content })
    }

    return {
      canChange,
      content,
      meetingType,
      meeting,
      menuItems,
      editing,
      submit
    }
  }
})
</script>
