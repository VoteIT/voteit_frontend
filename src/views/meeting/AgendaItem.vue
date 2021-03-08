<template>
  <div v-if="agendaItem">
    <h1>{{ agendaItem.title }}</h1>
    <div class="btn-controls">
      <WorkflowState v-if="agendaItem.state" :state="agendaItem.state" :admin="agendaItemType.rules.canChange(agendaItem)" :content-type="agendaItemType" :pk="agendaId" />
      <btn v-if="pollType.rules.canAdd(agendaItem)" sm icon="star" @click="$router.push(`${meetingPath}/polls/new/${agendaId}`)">{{ t('poll.new') }}</btn>
      <btn v-if="agendaItemType.rules.canChange(agendaItem)" sm :active="editingBody" icon="edit" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
    </div>
    <Richtext :key="agendaId" :editing="editingBody" :object="agendaItem" :channel="channel" @edit-done="editingBody = false" />
    <div class="speaker-lists" v-if="speakerSystems.length">
      <h2>{{ t('speaker.lists', speakerLists.length) }}</h2>
      <div class="btn-controls mb-1">
        <template v-for="system in speakerSystems" :key="system.pk">
          <Btn v-if="speakerListType.rules.canAdd(system)" @click="addSpeakerList(system)" icon="add">{{ t('speaker.addListToSystem', system) }}</Btn>
        </template>
      </div>
      <SpeakerList :list="list" v-for="list in speakerLists" :key="list.pk" />
    </div>
    <div class="row">
      <div class="col-sm-6">
        <h2>{{ t('proposal.proposals') }}</h2>
        <ul v-if="sortedProposals.length" class="no-list">
          <li v-for="p in sortedProposals" :key="p.pk">
            <Proposal :p="p"/>
          </li>
        </ul>
        <p v-else><em>{{ t('proposal.noProposals') }}</em></p>
        <AddContent v-if="proposalType.rules.canAdd(agendaItem)" :name="t('proposal.proposal')"
          :context-pk="agendaId" :content-type="proposalType" :tags="allTags" />
      </div>
      <div class="col-sm-6">
        <h2>{{ t('discussion.discussions') }}</h2>
        <ul v-if="sortedDiscussions.length" class="no-list">
          <li v-for="d in sortedDiscussions" :key="d.pk">
            <DiscussionPost :p="d"/>
          </li>
        </ul>
        <p v-else><em>{{ t('discussion.noDiscussions') }}</em></p>
        <AddContent v-if="discussionPostType.rules.canAdd(agendaItem)" :name="t('discussion.discussion')"
          :context-pk="agendaId" :content-type="discussionPostType" :tags="allTags" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import { openAlertEvent, orderBy } from '@/utils'

import AddContent from '@/components/meeting/AddContent.vue'
import DiscussionPost from '@/components/widgets/DiscussionPost.vue'
import Proposal from '@/components/widgets/Proposal.vue'
import Richtext from '@/components/widgets/Richtext.vue'
import SpeakerList from '@/components/widgets/SpeakerList.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useAgenda from '@/composables/meeting/useAgenda'
import useDiscussions from '@/composables/meeting/useDiscussions'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import pollType from '@/contentTypes/poll'
import proposalType from '@/contentTypes/proposal'
import speakerListType from '@/contentTypes/speakerList'
import { SpeakerSystem } from '@/contentTypes/types'
import { SpeakerListAddMessage } from '@/contentTypes/messages'

export default defineComponent({
  name: 'AgendaItem',
  inject: ['t'],
  setup () {
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId } = useMeeting()
    const { agendaId, agendaItem } = useAgenda()
    const channel = agendaItemType.getChannel()

    const sortedProposals = computed(() => {
      const ps = proposals.getAgendaProposals(agendaId.value)
      return orderBy(ps)
    })

    const sortedDiscussions = computed(() => discussions.getAgendaDiscussions(agendaId.value))
    const { getAgendaSpeakerLists, getSystems } = useSpeakerLists()
    const speakerLists = computed(() => getAgendaSpeakerLists(agendaId.value))
    const speakerSystems = computed(() => getSystems(meetingId.value))

    const editingBody = ref(false)

    const allTags = computed<Set<string>>(() => {
      const tags = new Set<string>()
      for (const p of sortedProposals.value) {
        p.tags.forEach(t => tags.add(t))
      }
      for (const d of sortedDiscussions.value) {
        d.tags.forEach(d => tags.add(d))
      }
      return tags
    })

    function addSpeakerList (system: SpeakerSystem) {
      openAlertEvent.emit('Not Implemented')
      const listData: SpeakerListAddMessage = {
        title: agendaItem.value?.title ?? '---',
        speaker_system: system.pk,
        agenda_item: agendaId.value
      }
      speakerListType.getContentApi().add(listData)
    }

    return {
      agendaId,
      agendaItem,
      allTags,
      channel,
      editingBody,
      meetingPath,
      sortedProposals,
      sortedDiscussions,
      speakerLists,
      speakerSystems,
      addSpeakerList,

      agendaItemType,
      discussionPostType,
      pollType,
      proposalType,
      speakerListType
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal,
    WorkflowState,
    SpeakerList,
    Richtext
  }
})
</script>

<style lang="sass">
/* Burn after reading */
.row
  display: flex
  flex-direction: row
  margin: 0 -10px
.col-sm-6
  width: calc(50% - 20px)
  margin: 0 10px

ul.no-list
  padding: 0
  > li
    list-style: none

.mb-1
  margin-bottom: 1em
</style>
