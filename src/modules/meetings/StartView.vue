<template>
  <v-row v-if="meeting">
    <v-col v-bind="cols.default">
      <header class="d-flex">
        <div class="flex-grow-1">
          <WorkflowState :admin="canChange" :contentType="meetingType" :object="meeting" />
          <Headline v-model="content.title" :editing="editing" @edit-done="submit()" />
        </div>
        <DropdownMenu :items="menuItems" />
      </header>
      <Richtext v-model="content.body" :editing="editing" @edit-done="submit()" variant="full" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import { MenuItem } from '@/utils/types'
import { meetingType } from './contentTypes'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'

export default defineComponent({
  inject: ['cols'],
  components: {
    Richtext,
    WorkflowState,
    Headline
  },
  setup () {
    const { t } = useI18n()
    const editing = ref(false)
    const { meeting, meetingId, canChange } = useMeeting()
    const { activeSpeakerSystems } = useSpeakerSystems(meetingId)

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
      const items: MenuItem[] = []
      if (canChange.value) {
        items.push({
          title: t('edit'),
          prependIcon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
        })
      }
      if (activeSpeakerSystems.value.length) {
        items.push('---')
        for (const system of activeSpeakerSystems.value) {
          items.push({
            title: t('speaker.fullscreenSystem', { ...system }),
            prependIcon: 'mdi-projector-screen-outline',
            to: `/speakers/${meetingId.value}/${system.pk}`
          })
        }
      }
      return items
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
