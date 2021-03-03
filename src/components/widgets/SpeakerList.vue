<template>
  <div>
    <h3>
      {{ list.title }}
      <WorkflowState :state="list.state" :content-type="speakerListType" :pk="pk" :admin="canChange(list)" />
    </h3>
    <div v-if="canStart(list)" class="btn-group">
      <btn icon="play_arrow" :disabled="!isActive || !queue.length" @click="speakers.startSpeaker(pk)" />
      <btn icon="stop" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(pk)" />
      <btn :disabled="isActive" :icon="isActive ? 'toggle_on' : 'toggle_off'" :title="isActive ? 'List is active' : 'Set active'" @click="speakers.setActiveList(pk)" />
    </div>
    <div v-if="isOpen">
      <btn v-if="inList" icon="undo" @click="speakers.leaveList(pk)">Leave list</btn>
      <btn v-else icon="add" @click="speakers.enterList(pk)">Enter list</btn>
    </div>
    <div v-if="currentSpeaker">
      Speaking: <user :pk="currentSpeaker" />
    </div>
    <ol v-if="queue.length">
      <li v-for="userPk in queue" :key="userPk"><user :pk="userPk"/></li>
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

export default defineComponent({
  name: 'SpeakerList',
  props: {
    list: {
      type: Object as PropType<SpeakerList>,
      required: true
    }
  },
  components: {
    WorkflowState
  },
  setup (props) {
    const speakers = useSpeakerLists()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.list_system))
    const queue = computed(() => speakers.getQueue(props.list.pk))
    const currentSpeaker = computed(() => speakers.getCurrent(props.list.pk))
    const inList = computed(() => speakers.userInList(props.list.pk))
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
