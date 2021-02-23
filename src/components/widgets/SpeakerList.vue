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

<script lang="ts">
import { computed, defineComponent } from 'vue'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import WorkflowState from './WorkflowState.vue'

export default defineComponent({
  name: 'SpeakerList',
  props: {
    pk: {
      type: Number,
      required: true
    }
  },
  components: {
    WorkflowState
  },
  setup (props) {
    const speakers = useSpeakerLists()

    const list = computed(() => speakers.getList(props.pk))
    const listSystem = computed(() => list.value && speakers.getSystem(list.value.list_system))
    const queue = computed(() => speakers.getQueue(props.pk))
    const currentSpeaker = computed(() => speakers.getCurrent(props.pk))
    const inList = computed(() => speakers.userInList(props.pk))
    const listIsActive = computed(() => listSystem.value && listSystem.value.active_list === props.pk)

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
})
</script>
