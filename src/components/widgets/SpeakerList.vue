<template>
  <div>
    <h3>
      {{ list.title }}
      <WorkflowState :state="list.state" :content-type="speakerListType" :pk="list.pk" :admin="canChange(list)" />
      <Btn sm :disabled="isActive" :icon="isActive ? 'toggle_on' : 'toggle_off'" :title="isActive ? 'List is active' : 'Set active'" @click="speakers.setActiveList(list)" />
    </h3>
    <div v-if="canStart(list)" class="btn-group">
      <Btn icon="play_arrow" :disabled="!isActive || !queue.length" @click="speakers.startSpeaker(list)" />
      <Btn icon="stop" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(list)" />
    </div>
    <div v-if="isOpen">
      <Btn v-if="inList" icon="undo" @click="speakers.leaveList(list)">Leave list</Btn>
      <Btn v-else icon="add" @click="speakers.enterList(list)">Enter list</Btn>
    </div>
    <div v-if="currentSpeaker">
      Speaking: <User :pk="currentSpeaker.userid" /> <Moment in-seconds :date="currentSpeaker.started" />
    </div>
    <ol v-if="queue.length">
      <li v-for="userPk in queue" :key="userPk"><User :pk="userPk"/></li>
    </ol>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import WorkflowState from './WorkflowState.vue'
import speakerListType from '@/contentTypes/speakerList'
import { SpeakerList } from '@/contentTypes/types'
import { SpeakerListState } from '@/contentTypes/speakerList/workflowStates'
import Moment from './Moment.vue'

export default defineComponent({
  name: 'SpeakerList',
  props: {
    list: {
      type: Object as PropType<SpeakerList>,
      required: true
    }
  },
  components: {
    WorkflowState,
    Moment
  },
  setup (props) {
    const speakers = useSpeakerLists()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.speaker_system))
    const queue = computed(() => speakers.getQueue(props.list))
    const currentSpeaker = computed(() => speakers.getCurrent(props.list))
    const inList = computed(() => speakers.userInList(props.list))
    // eslint-disable-next-line camelcase
    const isActive = computed(() => listSystem.value?.active_list === props.list.pk)
    const isOpen = computed(() => props.list.state === SpeakerListState.Open)

    return {
      speakerListType,
      isActive,
      isOpen,
      queue,
      currentSpeaker,
      inList,
      ...rules,
      speakers
    }
  }
})
</script>
