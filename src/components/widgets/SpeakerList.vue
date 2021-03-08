<template>
  <Widget>
    <div class="btn-controls">
      <WorkflowState :state="list.state" :content-type="speakerListType" :pk="list.pk" :admin="canChange(list)" />
      <Btn sm :disabled="isActive" :icon="isActive ? 'toggle_on' : 'toggle_off'" :title="isActive ? 'List is active' : 'Set active'" @click="speakers.setActiveList(list)" />
    </div>
    <h3>
      {{ list.title }}
      <Btn sm v-if="inList && canLeave(list)" icon="undo" @click="speakers.leaveList(list)">Leave list</Btn>
      <Btn sm v-else-if="canEnter(list)" icon="add" @click="speakers.enterList(list)">Enter list</Btn>
    </h3>
    <div v-if="canStart(list)" class="btn-group">
      <Btn icon="play_arrow" :disabled="!isActive || !queue.length" @click="speakers.startSpeaker(list)" />
      <Btn icon="stop" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(list)" />
    </div>
    <p v-if="currentSpeaker">
      {{ t('speaker.currentlySpeaking') }}:
      <strong><User :pk="currentSpeaker.userid" /></strong> <Moment in-seconds :date="currentSpeaker.started" />
    </p>
    <h4>{{ t('speaker.queue') }}</h4>
    <ol v-if="queue.length">
      <li v-for="userPk in queue" :key="userPk"><User :pk="userPk"/></li>
    </ol>
    <p v-else>
      <em>{{ t('speaker.queueEmpty') }}</em>
    </p>
  </Widget>
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
  inject: ['t'],
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

<style lang="sass" scoped>
.btn-controls
  float: right

h3
  margin-top: 0
  button
    margin-left: 1em
</style>
