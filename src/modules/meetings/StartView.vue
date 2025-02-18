<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { MenuItem } from '@/utils/types'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
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

const contentChanged = computed(
  () =>
    content.title !== meeting.value?.title ||
    content.body !== meeting.value?.body
)

function cancelEdit() {
  editing.value = false
  if (!meeting.value) return
  content.body = meeting.value.body
  content.title = meeting.value.title
}

function submit() {
  editing.value = false
  if (contentChanged.value)
    meetingType.api.patch(meetingId.value, { ...content })
}
</script>

<template>
  <v-row v-if="meeting">
    <v-col v-if="editing" class="py-6" v-bind="cols.default">
      <Headline v-model="content.title" class="mb-2" editing @submit="submit" />
      <RichtextEditor
        v-model="content.body"
        class="mb-3"
        @keydown.ctrl.enter="submit"
        variant="full"
      />
      <div class="text-right">
        <v-btn :text="$t('cancel')" variant="text" @click="cancelEdit" />
        <v-btn
          :text="$t('save')"
          color="primary"
          :disabled="!contentChanged"
          @click="submit"
        />
      </div>
    </v-col>
    <v-col v-else v-bind="cols.default">
      <header class="d-flex">
        <div class="flex-grow-1">
          <WorkflowState
            :admin="isModerator"
            :contentType="meetingType"
            :object="meeting"
          />
          <h1>{{ meeting.title }}</h1>
        </div>
        <DropdownMenu :items="menuItems" />
      </header>
      <v-alert
        v-if="meeting.state == MeetingState.Deleting"
        :text="$t('meeting.markedForDeleteWarn')"
        type="warning"
        class="my-2"
      />
      <Richtext :value="meeting.body" />
    </v-col>
  </v-row>
</template>
