<template>
  <Proposal v-for="p in proposals" :key="p.pk" :p="p" class="mb-4">
    <template #buttons>
      <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: p.pk }">
        {{ btn.title }}
      </ReactionButton>
      <component v-for="{ component }, i in plugins" :key="i" :is="component" :proposal="p" />
    </template>
  </Proposal>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ReactionButton from '../reactions/ReactionButton.vue'
import useReactions from '../reactions/useReactions'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import { Proposal } from './types'
import { proposalType } from './contentTypes'
import { proposalButtonPlugins } from './registry'

export default defineComponent({
  components: {
    ReactionButton
  },
  props: {
    proposals: {
      type: Array as PropType<Proposal[]>,
      required: true
    }
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingId } = useMeeting()
    const { agendaId } = useAgenda(meetingId)
    const { canAddProposal } = useAgendaItem(agendaId)
    const { getMeetingButtons } = useReactions()

    async function submit (body: string, tags: string[]) {
      await proposalType.api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }

    const addComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'proposal'))
    const plugins = computed(() => meeting.value ? proposalButtonPlugins.getActivePlugins(meeting.value) : [])

    return {
      t,
      addComponent,
      canAddProposal,
      plugins,
      reactions,
      submit
    }
  }
})
</script>
