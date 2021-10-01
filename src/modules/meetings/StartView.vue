<template>
  <v-row v-if="meeting">
    <v-col lg="8" offset-lg="2">
      <header>
        <Menu float :items="menuItems" />
        <Headline v-model="content.title" :editing="editing" @edit-done="submit()" />
      </header>
      <WorkflowState :admin="canChange(meeting)" :content-type="meetingType" :object="meeting" />
      <Richtext v-model="content.body" :editing="editing" @edit-done="submit()" variant="full" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'

import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import meetingType from '@/contentTypes/meeting'
import { useI18n } from 'vue-i18n'
import { MenuItem } from '@/utils/types'
import { useTitle } from '@vueuse/core'

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
    const api = meetingType.getContentApi()
    const { meeting, meetingId } = useMeeting()

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
      if (!meetingType.rules.canChange(meeting.value)) return []
      return [{
        title: t('edit'),
        icon: 'mdi-pencil',
        onClick: async () => { editing.value = true }
      }]
    })

    function submit () {
      editing.value = false
      if (content.title === meeting.value?.title && content.body === meeting.value?.body) return
      api.patch(meetingId.value, { ...content })
    }

    return {
      content,
      meetingType,
      ...meetingType.rules,
      meeting,
      menuItems,
      editing,
      submit
    }
  }
})
</script>
