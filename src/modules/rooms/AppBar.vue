<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle } from '@vueuse/core'
import { useDisplay } from 'vuetify/lib/framework.mjs'

import DefaultDialog from '@/components/DefaultDialog.vue'
import HeaderMenu from '@/components/HeaderMenu.vue'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useMeetingPolls from '../polls/useMeetingPolls'

import RealTimePollModal from './RealTimePollModal.vue'
import { roomDisplayMode } from './displayOptions'
import useRoom from './useRoom'
import RealTimeVotingModal from './RealTimeVotingModal.vue'

const { t } = useI18n()
const { isModerator, meeting, meetingId, meetingRoute } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { meetingRoom, passiveMode, textSize, getRoomRoute } = useRoom()
const { firstUnvotedPoll, meetingHasPoll } = useMeetingPolls(meetingId)
const { mobile } = useDisplay()

const { idle } = useIdle(5_000)
const passiveIdle = computed(() => passiveMode.value && idle.value)

const textSizes = computed(() => {
  return [
    {
      value: 'normal',
      title: t('content.textSizeNormal')
    },
    {
      value: 'large',
      title: t('content.textSizeLarge')
    },
    {
      value: 'x-large',
      title: t('content.textSizeXLarge')
    }
  ]
})

const crumbs = computed(() => {
  return [
    { title: meeting.value?.title ?? '', to: meetingRoute.value },
    { title: meetingRoom.value?.title ?? '' }
  ]
})

const displayOptions = computed(() => [
  {
    value: 'any',
    prependIcon: 'mdi-view-split-vertical',
    title: t('room.displayAny')
  },
  {
    value: 'prioritizeSpeakers',
    prependIcon: 'mdi-bullhorn',
    title: t('room.prioritizeSpeakers')
  },
  {
    value: 'onlySpeakers',
    prependIcon: 'mdi-bullhorn',
    title: t('room.onlySpeakers')
  },
  {
    value: 'prioritizeProposals',
    prependIcon: 'mdi-gavel',
    title: t('room.prioritizeProposals')
  },
  {
    value: 'onlyProposals',
    prependIcon: 'mdi-gavel',
    title: t('room.onlyProposals')
  }
])
const currentDisplay = computed(
  () =>
    displayOptions.value.find(({ value }) => value === roomDisplayMode.value)!
)

/**
 * Moderators entering real-time view should get the choice to activate passive mode
 */
const moderatorPassiveDialog = ref(false)
watch(
  isModerator,
  (value) => {
    // For moderator only, if not passive mode already, not on mobile.
    if (!value || passiveMode.value || mobile.value) return
    moderatorPassiveDialog.value = true
  },
  { immediate: true }
)

function dialogSetPassiveMode(mode: boolean) {
  passiveMode.value = mode
  moderatorPassiveDialog.value = false
}
</script>

<template>
  <v-app-bar flat color="app-bar">
    <DefaultDialog
      v-model="moderatorPassiveDialog"
      :title="t('room.passiveMode')"
    >
      <p class="mb-4">
        {{ t('room.moderatorPassiveQuery') }}
      </p>
      <div class="d-flex" style="gap: 10px">
        <v-sheet
          class="cursor-pointer text-center pa-6"
          color="background"
          rounded
          style="width: 50%"
          @click="dialogSetPassiveMode(false)"
          v-ripple="{ class: 'text-primary' }"
        >
          <v-icon
            class="my-3"
            color="primary"
            icon="mdi-account"
            size="x-large"
          />
          <p>{{ t('room.moderatorPassiveOff') }}</p>
        </v-sheet>
        <v-sheet
          class="cursor-pointer text-center pa-6"
          color="background"
          rounded
          style="width: 50%"
          @click="dialogSetPassiveMode(true)"
          v-ripple="{ class: 'text-success' }"
        >
          <v-icon
            class="my-3"
            color="success"
            icon="mdi-projector"
            size="x-large"
          />
          <p>{{ t('room.moderatorPassiveOn') }}</p>
        </v-sheet>
      </div>
    </DefaultDialog>
    <router-link :to="meetingRoute">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title class="text-truncate">
      <v-fade-transition>
        <small v-show="!passiveMode && !mobile" class="position-absolute">
          {{ t('room.realTime') }}
        </small>
      </v-fade-transition>
      <v-breadcrumbs :items="crumbs" />
    </v-app-bar-title>
    <template v-if="meetingHasPoll">
      <RealTimeVotingModal v-if="!passiveMode" :open-poll="meetingRoom?.poll">
        <template #activator="{ props }">
          <v-btn
            class="mx-1"
            :color="firstUnvotedPoll ? 'yellow' : undefined"
            prepend-icon="mdi-star"
            :text="t('room.toPoll')"
            :variant="firstUnvotedPoll ? 'outlined' : undefined"
            v-bind="props"
          />
        </template>
      </RealTimeVotingModal>
      <RealTimePollModal
        v-else-if="meetingRoom?.poll"
        :poll-id="meetingRoom.poll"
      >
        <template #activator="{ props }">
          <v-btn
            prepend-icon="mdi-star"
            :text="t('room.toPoll')"
            v-bind="props"
          />
        </template>
      </RealTimePollModal>
    </template>
    <v-btn
      v-if="!passiveMode && isModerator && meetingRoom && agenda.length"
      append-icon="mdi-chevron-right"
      class="d-none d-md-flex"
      :text="t('room.toPlenaryView')"
      variant="tonal"
      :to="
        getRoomRoute('room:broadcast', {
          aid: meetingRoom.agenda_item || agenda[0].pk,
          tab: 'decisions'
        })
      "
    />
    <v-menu>
      <template #activator="{ props, isActive }">
        <v-fade-transition>
          <v-btn
            v-show="isActive || !passiveIdle"
            v-bind="props"
            prepend-icon="mdi-format-size"
            append-icon="mdi-chevron-down"
            :text="mobile ? undefined : t('content.textSize')"
          />
        </v-fade-transition>
      </template>
      <HeaderMenu :title="t('content.textSize')" icon="mdi-format-size">
        <v-list :selected="[textSize]" @update:selected="textSize = $event[0]">
          <v-list-item
            v-for="{ value, title } in textSizes"
            :key="value"
            :value="value"
            :title="title"
            :prepend-icon="
              textSize === value ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'
            "
          />
        </v-list>
      </HeaderMenu>
    </v-menu>
    <v-menu>
      <template #activator="{ props, isActive }">
        <v-fade-transition>
          <v-btn
            v-show="isActive || !passiveIdle"
            v-bind="props"
            :prepend-icon="currentDisplay.prependIcon"
            append-icon="mdi-chevron-down"
            :text="mobile ? undefined : currentDisplay.title"
          />
        </v-fade-transition>
      </template>
      <HeaderMenu
        :title="t('room.realTime')"
        :subtitle="t('room.displayOptions')"
        icon="mdi-television-play"
      >
        <v-list>
          <v-item-group mandatory v-model="roomDisplayMode">
            <v-item
              v-for="{ value, ...props } in displayOptions"
              :key="value"
              :value="value"
              v-slot="{ isSelected, toggle }"
            >
              <v-list-item
                v-bind="props"
                :active="isSelected"
                @click="toggle"
              />
            </v-item>
            <v-list-item
              :active="passiveMode"
              :prepend-icon="
                passiveMode
                  ? 'mdi-checkbox-marked'
                  : 'mdi-checkbox-blank-outline'
              "
              :title="t('room.passiveMode')"
              :subtitle="t('room.passiveModeHint')"
              @click.stop="passiveMode = !passiveMode"
            />
          </v-item-group>
        </v-list>
      </HeaderMenu>
    </v-menu>
  </v-app-bar>
</template>

<style scoped lang="sass">
.v-toolbar-title small
  opacity: var(--v-disabled-opacity)
  margin-left: 17px
  margin-top: -6px
  font-size: .65em
</style>
