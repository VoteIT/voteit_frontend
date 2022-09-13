<template>
  <v-card class="speaker-list mb-2" :title="list.title" :border="isActive" :flat="!isActive" :subtitle="isActive ? t('speaker.listActive') : t('speaker.list')">
    <v-card-text>
      <p v-if="list.current" class="mb-2">
        {{ t('speaker.currentlySpeaking') }}:
        <strong><User :pk="list.current" /></strong>
      </p>
      <h3>
        {{ t('speaker.queue') }}
        <v-btn :class="{ expanded: expandQueue }" variant="text" size="small" v-if="list.queue.length > 1 && (list.queue.length !== 2 || list.queue[1] !== user?.pk)" @click="expandQueue = !expandQueue" icon="mdi-chevron-down" />
      </h3>
      <div v-if="list.queue.length">
        <template v-for="(userPk, i) in list.queue" :key="userPk">
          <v-expand-transition>
            <div :class="{ self: userPk === user?.pk }" v-show="expandQueue || i === 0 || userPk === user?.pk">
              {{ i+1 }}. <User :pk="userPk"/>
            </div>
          </v-expand-transition>
        </template>
      </div>
      <p v-else>
        <em>{{ t('speaker.queueEmpty') }}</em>
      </p>
    </v-card-text>
    <v-card-actions v-if="enterLeaveBtn" class="flex-wrap">
      <v-btn variant="elevated" :prepend-icon="enterLeaveBtn.icon" :color="enterLeaveBtn.color" @click="enterLeaveBtn.action()">
        {{ enterLeaveBtn.title }}
      </v-btn>
      <v-btn :to="`${meetingPath}/lists/${list.speaker_system}/${list.agenda_item}`" prepend-icon="mdi-bullhorn" v-if="canChange">
        {{ t('manage') }}
      </v-btn>
      <div class="d-flex flex-grow-1">
        <v-spacer />
        <v-btn v-if="fullscreenPath" :to="fullscreenPath" icon="mdi-overscan" />
      </div>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'

import useMeeting from '@/modules/meetings/useMeeting'
import { canChangeSpeakerList, canEnterList, canLeaveList } from './rules'
import { SpeakerList, SpeakerListState } from './types'

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
  setup (props) {
    const { t } = useI18n()
    const speakers = useSpeakerLists()
    const { meetingId, meetingPath } = useMeeting()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.speaker_system))
    const inList = computed(() => speakers.userInList(props.list))
    // eslint-disable-next-line camelcase
    const isActive = computed(() => listSystem.value?.active_list === props.list.pk)
    const isOpen = computed(() => props.list.state === SpeakerListState.Open)
    const expandQueue = ref(false)

    const enterLeaveBtn = computed<EnterLeaveBtn | null>(() => {
      if (!inList.value && canEnterList(props.list)) {
        return {
          icon: 'mdi-playlist-plus',
          title: t('speaker.enterList'),
          color: 'primary',
          action: () => speakers.enterList(props.list)
        }
      }
      if (inList.value && canLeaveList(props.list)) {
        return {
          icon: 'mdi-playlist-remove',
          title: t('speaker.leaveList'),
          color: 'warning',
          action: () => speakers.leaveList(props.list)
        }
      }
      return null
    })

    const canChange = computed(() => canChangeSpeakerList(props.list))

    return {
      t,
      canChange,
      expandQueue,
      isActive,
      isOpen,
      fullscreenPath: computed(() => isActive.value && `/speakers/${meetingId.value}/${props.list.speaker_system}`),
      inList,
      enterLeaveBtn,
      meetingPath,
      speakers,
      user
    }
  }
})
</script>

<style lang="sass">
.speaker-list
  .btn-controls
    float: right

  h3 .mdi
    cursor: pointer

  ol
    padding-left: 1.5em

  .self
    font-weight: 700

  .mdi-chevron-down
    transition: transform .2s
  .expanded .mdi-chevron-down
    transform: rotate(180deg)
</style>
