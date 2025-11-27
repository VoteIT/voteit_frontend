<script setup lang="ts">
import { sorted } from 'itertools'
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import TypedEvent from '@/utils/TypedEvent'
import CollapsibleMenu from '@/components/CollapsibleMenu.vue'
import { canAddPoll } from '@/modules/polls/rules'
import usePolls from '@/modules/polls/usePolls'

import useMeeting from '../useMeeting'

const { t } = useI18n()
const { meeting, meetingId, getMeetingRoute } = useMeeting()
const { getUnvotedPolls } = usePolls()

const unvotedPolls = computed(() =>
  sorted(getUnvotedPolls(meetingId.value), (p) => p.started ?? '')
)

function* iterPollLinks() {
  yield {
    exactActive: true,
    title: t('poll.all'),
    to: getMeetingRoute('polls')
  }
  if (meeting.value && canAddPoll(meeting.value))
    yield {
      title: t('poll.new'),
      to: getMeetingRoute('pollStart'),
      icons: ['mdi-star-plus']
    }
}
const pollLinks = computed(() => [...iterPollLinks()])

const hasUnvotedPolls = computed(() => !!unvotedPolls.value.length)
const openPollMenuEvent = new TypedEvent()
watch(hasUnvotedPolls, (value, oldValue) => {
  if (value && !oldValue) openPollMenuEvent.emit()
})

const unvotedPollLinks = computed(() =>
  unvotedPolls.value.map((p) => ({
    title: p.title,
    to: getMeetingRoute('poll', { pid: p.pk, pslug: slugify(p.title) }),
    icons: ['mdi-star']
  }))
)

const isOpen = shallowRef(false)
</script>

<template>
  <li>
    <CollapsibleMenu
      auto-open
      :icon="hasUnvotedPolls ? 'mdi-star' : 'mdi-star-outline'"
      :links="pollLinks"
      :open-event="openPollMenuEvent"
      :title="$t('poll.poll', 2)"
      v-model="isOpen"
    >
      <template #append v-if="unvotedPolls.length">
        <CollapsibleMenu
          modelValue
          :links="unvotedPollLinks"
          :title="$t('poll.unvoted')"
          @activated="isOpen = true"
        />
      </template>
    </CollapsibleMenu>
  </li>
</template>
