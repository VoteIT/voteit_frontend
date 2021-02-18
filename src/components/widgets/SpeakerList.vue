<template>
  <div>
    <h3>
      {{ list.title }}
      <workflow-state :state="list.state" content-type="speakerList" :pk="pk" :admin="canChange(list)" />
    </h3>
    <div v-if="canStart(list)" class="btn-group">
      <btn icon="play_arrow" :disabled="!listIsActive || !queue.length" @click="speakers.startSpeaker(pk)" />
      <btn icon="stop" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(pk)" />
      <btn :disabled="listIsActive" :icon="listIsActive ? 'toggle_on' : 'toggle_off'" :title="listIsActive ? 'List is active' : 'Set active'" @click="speakers.setActiveList(pk)" />
    </div>
    <div v-if="list.state === 'open'">
      <btn v-if="!inList" icon="add" @click="speakers.enterList(pk)">Enter list</btn>
      <btn v-else icon="undo" @click="speakers.leaveList(pk)">Leave list</btn>
    </div>
    <div v-if="currentSpeaker">
      Speaking: <user :pk="currentSpeaker" />
    </div>
    <ol v-if="queue.length">
      <li v-for="userPk in queue" :key="userPk"><user :pk="userPk"/></li>
    </ol>
  </div>
</template>

<script>
import { computed } from 'vue'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import WorkflowState from './WorkflowState'

export default {
  name: 'SpeakerList',
  props: {
    pk: Number
  },
  components: {
    WorkflowState
  },
  setup (props) {
    const speakers = useSpeakerLists()

    const list = computed(_ => speakers.getList(props.pk))
    const listSystem = computed(_ => list.value && speakers.getSystem(list.value.list_system))
    const queue = computed(_ => speakers.getQueue(props.pk))
    const currentSpeaker = computed(_ => speakers.getCurrent(props.pk))
    const inList = computed(_ => speakers.userInList(props.pk))
    const listIsActive = computed(_ => listSystem.value && listSystem.value.active_list === props.pk)

    return {
      list,
      listIsActive,
      queue,
      currentSpeaker,
      inList,
      ...rules,
      speakers
    }
  }
}
</script>
