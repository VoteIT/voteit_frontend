<template>
  <v-row v-if="meeting">
    <v-col v-bind="cols.default">
      <header class="d-flex">
        <div class="flex-grow-1">
          <WorkflowState
            :admin="isModerator"
            :contentType="meetingType"
            :object="meeting"
          />
          <Headline
            v-model="content.title"
            :editing="editing"
            @edit-done="submit()"
          />
        </div>
        <DropdownMenu :items="menuItems" />
      </header>
      <v-alert
        v-if="meeting.state == MeetingState.Deleting"
        :text="t('meeting.markedForDeleteWarn')"
        type="warning"
        class="my-2"
      />
      <Richtext
        v-model="content.body"
        :editing="editing"
        @edit-done="submit()"
        variant="full"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { MenuItem } from '@/utils/types'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useDefaults from '@/composables/useDefaults'

import { meetingType } from './contentTypes'
import useMeeting from './useMeeting'
import { MeetingState } from './types'
import { meetingMenuPlugins } from './registry'

const { t } = useI18n()
const { cols } = useDefaults()

const editing = ref(false)
const { meeting, meetingId, canChange, isModerator } = useMeeting()

useTitle(computed(() => `${meeting.value?.title} | VoteIT`))

const content = reactive({
  title: meeting.value?.title ?? '',
  body: meeting.value?.body ?? ''
})
watch(meeting, (value) => {
  if (editing.value) return
  content.title = value?.title ?? ''
  content.body = value?.body ?? ''
})

function* iterMenu() {
  if (!meeting.value) return
  if (canChange.value)
    yield {
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => {
        editing.value = true
      }
    }
  // Extra menu items from plugins
  const pluginMenuItems = meetingMenuPlugins
    .getActivePlugins(meeting.value)
    .flatMap((plugin) =>
      plugin.getItems({ meeting: meeting.value!, menu: 'start', t })
    )
  if (pluginMenuItems.length) yield '---'
  yield* pluginMenuItems
}

const menuItems = computed<MenuItem[]>(() => [...iterMenu()])

function submit() {
  editing.value = false
  if (
    content.title === meeting.value?.title &&
    content.body === meeting.value?.body
  )
    return
  meetingType.api.patch(meetingId.value, { ...content })
}
</script>
