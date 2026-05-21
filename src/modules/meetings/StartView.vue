<script lang="ts" setup>
import { computed, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { cols } from '@/utils/defaults'
import { parseRestError } from '@/utils/restApi'
import { MenuItem, RestError } from '@/utils/types'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useRules from '@/composables/useRules'

import { meetingType } from './contentTypes'
import useMeeting from './useMeeting'
import { Meeting, MeetingState } from './types'
import { meetingMenuPlugins } from './registry'

const { t } = useI18n()

const editing = shallowRef(false)
const saving = shallowRef(false)
const { meeting, meetingId, canChange, isModerator } = useMeeting()
const rules = useRules(t)

useTitle(computed(() => `${meeting.value?.title} | VoteIT`))

const contentErrors = shallowRef<RestError<Meeting> | null>(null)
const content = reactive({
  title: meeting.value?.title ?? '',
  body: meeting.value?.body ?? ''
})
watch(content, () => (contentErrors.value = null), { deep: true })
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

async function submit() {
  if (!contentChanged.value) return
  saving.value = true
  try {
    await meetingType.api.patch(meetingId.value, { ...content })
    editing.value = false
  } catch (e) {
    contentErrors.value = parseRestError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-row v-if="meeting">
    <v-col v-if="editing" class="py-6" v-bind="cols.default">
      <Headline
        editing
        :error-messages="contentErrors?.title"
        :rules="[rules.required]"
        v-model="content.title"
        @submit="submit"
      />
      <RichtextEditor
        :error-messages="contentErrors?.body"
        variant="full"
        v-model="content.body"
        @keydown.ctrl.enter="submit"
      />
      <v-expand-transition>
        <div v-if="contentErrors?.non_field_errors">
          <v-alert
            class="mb-3"
            :text="contentErrors.non_field_errors.join(', ')"
            type="error"
          />
        </div>
      </v-expand-transition>
      <div class="text-right">
        <v-btn :text="$t('cancel')" variant="text" @click="cancelEdit" />
        <v-btn
          color="primary"
          :disabled="!contentChanged"
          :loading="saving"
          :text="$t('save')"
          type="submit"
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
