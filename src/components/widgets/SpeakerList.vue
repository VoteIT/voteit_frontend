<template>
  <Widget :selected="isActive">
    <div class="btn-controls">
      <v-btn size="small" color="warning" v-if="inList && canLeave(list)" @click="speakers.leaveList(list)">
        <v-icon left icon="mdi-playlist-remove"/>
        Leave list
      </v-btn>
      <v-btn size="small" v-else-if="canEnter(list)" @click="speakers.enterList(list)">
        <v-icon left icon="mdi-playlist-plus" />
        Enter list
      </v-btn>
      <WorkflowState :state="list.state" :content-type="speakerListType" :pk="list.pk" :admin="canChange(list)" />
      <Btn sm v-if="canDelete(list)" icon="mdi-delete" color="warning" :title="t('delete')" @click="deleteList(list)" />
    </div>
    <h3>
      {{ list.title }}
      <v-icon v-if="isActive" icon="mdi-toggle-switch" :title="t('speaker.isActiveList')"/>
      <v-icon v-if="canActivate(list)" icon="mdi-toggle-switch-off" :title="t('speaker.setActiveList')" @click="speakers.setActiveList(list)" />
    </h3>
    <div v-if="canStart(list)" class="btn-group">
      <v-btn :disabled="!isActive || !queue.length" @click="speakers.startSpeaker(list)"><v-icon icon="mdi-play"/></v-btn>
      <v-btn :disabled="!currentSpeaker" @click="speakers.stopSpeaker(list)"><v-icon icon="mdi-stop"/></v-btn>
    </div>
    <p v-if="currentSpeaker" class="mb-2">
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
import { computed, defineComponent, inject, PropType } from 'vue'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import WorkflowState from './WorkflowState.vue'
import speakerListType from '@/contentTypes/speakerList'
import { SpeakerList } from '@/contentTypes/types'
import { SpeakerListState } from '@/contentTypes/speakerList/workflowStates'
import Moment from './Moment.vue'
import { dialogQuery } from '@/utils'

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
    const t = inject('t') as (text: string) => string
    const speakers = useSpeakerLists()
    const api = speakerListType.getContentApi()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.speaker_system))
    const queue = computed(() => speakers.getQueue(props.list))
    const currentSpeaker = computed(() => speakers.getCurrent(props.list))
    const inList = computed(() => speakers.userInList(props.list))
    // eslint-disable-next-line camelcase
    const isActive = computed(() => listSystem.value?.active_list === props.list.pk)
    const isOpen = computed(() => props.list.state === SpeakerListState.Open)

    function deleteList (list: SpeakerList) {
      dialogQuery(t('speaker.deleteListConfirmation'))
        .then(() => api.delete(list.pk))
    }

    return {
      deleteList,
      speakerListType,
      isActive,
      isOpen,
      queue,
      currentSpeaker,
      inList,
      ...rules,
      speakers,
      t
    }
  }
})
</script>

<style lang="sass" scoped>
.btn-controls
  float: right

h3 .mdi
  cursor: pointer

ol
  padding-left: 1.5em
</style>
