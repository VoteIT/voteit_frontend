<template>
  <Proposal v-for="p in proposals" :key="p.pk" :p="p">
    <template v-slot:buttons>
      <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: p.pk }">{{ btn.title }}</ReactionButton>
    </template>
  </Proposal>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ReactionButton from '../reactions/ReactionButton.vue'
import useReactions from '../reactions/useReactions'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import { focusProposalInput } from '../agendas/events'
import { Proposal } from './types'
import ProposalVue from './Proposal.vue'
import { proposalType } from './contentTypes'

export default defineComponent({
  components: {
    Proposal: ProposalVue,
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
    const { agendaId, canAddProposal } = useAgendaItem()
    const { meetingId } = useMeeting()
    const { getMeetingButtons } = useReactions()

    async function submit (body: string, tags: string[]) {
      await proposalType.api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }

    const addComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    focusProposalInput.on(() => addComponent.value?.focus())
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'proposal'))

    return {
      t,
      addComponent,
      canAddProposal,
      reactions,
      submit
    }
  }
})
</script>
