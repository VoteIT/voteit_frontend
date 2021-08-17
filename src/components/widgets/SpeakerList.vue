<template>
  <v-card :color="isActive ? 'primary' : undefined" class="mb-2">
    <v-card-title>
      {{ list.title }}
    </v-card-title>
    <v-card-text>
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
    </v-card-text>
    <v-card-actions v-if="enterLeaveBtn">
      <v-btn :prepend-icon="enterLeaveBtn.icon" :color="enterLeaveBtn.color" @click="enterLeaveBtn.action()">
        {{ enterLeaveBtn.title }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import speakerListType from '@/contentTypes/speakerList'
import { SpeakerList } from '@/contentTypes/types'
import { SpeakerListState } from '@/contentTypes/speakerList/workflowStates'
import Moment from './Moment.vue'

interface EnterLeaveBtn {
  icon: string
  title: string
  color?: string
  action: () => void
}

export default defineComponent({
  name: 'SpeakerList',
  props: {
    list: {
      type: Object as PropType<SpeakerList>,
      required: true
    }
  },
  components: {
    Moment
  },
  setup (props) {
    const { t } = useI18n()
    const speakers = useSpeakerLists()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.speaker_system))
    const queue = computed(() => speakers.getQueue(props.list))
    const currentSpeaker = computed(() => speakers.getCurrent(props.list))
    const inList = computed(() => speakers.userInList(props.list))
    // eslint-disable-next-line camelcase
    const isActive = computed(() => listSystem.value?.active_list === props.list.pk)
    const isOpen = computed(() => props.list.state === SpeakerListState.Open)

    const enterLeaveBtn = computed<EnterLeaveBtn | null>(() => {
      if (!inList.value && rules.canEnter(props.list)) {
        return {
          icon: 'mdi-playlist-plus',
          title: t('speaker.enterList'),
          color: 'primary',
          action: () => speakers.enterList(props.list)
        }
      }
      if (inList.value && rules.canLeave(props.list)) {
        return {
          icon: 'mdi-playlist-remove',
          title: t('speaker.leaveList'),
          color: 'warning',
          action: () => speakers.leaveList(props.list)
        }
      }
      return null
    })

    return {
      speakerListType,
      isActive,
      isOpen,
      queue,
      currentSpeaker,
      inList,
      enterLeaveBtn,
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
