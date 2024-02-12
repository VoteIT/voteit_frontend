<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Tag from '@/components/Tag.vue'
import useMeetingGroups from '../meetings/useMeetingGroups'

import { Proposal } from './types'
import ProposalText from './ProposalText.vue'
import useMeeting from '../meetings/useMeeting'
import User from '@/components/User.vue'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { getMeetingGroup } = useMeetingGroups(meetingId)

const props = defineProps<{
  proposal: Proposal
}>()

const meetingGroup = computed(
  () =>
    props.proposal.meeting_group &&
    getMeetingGroup(props.proposal.meeting_group)
)
</script>

<template>
  <v-sheet rounded>
    <div class="pa-4">
      <div class="d-flex">
        <div class="flex-grow-1">
          <Tag :name="proposal.prop_id" />
        </div>
        <slot name="actions"></slot>
      </div>
      <ProposalText :proposal="proposal" />
      <div class="text-secondary">
        <v-icon
          v-if="meetingGroup"
          size="small"
          class="mr-1"
          style="position: relative; top: -1px"
          >mdi-account-multiple</v-icon
        >
        <span
          >{{ t('by') }}
          <span v-if="meetingGroup">
            {{ meetingGroup.title }}
          </span>
          <User v-else-if="proposal.author" :pk="proposal.author" userid />
        </span>
      </div>
      <slot name="append"></slot>
    </div>
    <slot name="bottom"></slot>
  </v-sheet>
</template>
