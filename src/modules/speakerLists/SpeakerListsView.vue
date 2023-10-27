<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, RouteLocationRaw, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onKeyStroke } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import useAgenda from '../agendas/useAgenda'
import { AgendaItem } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import MeetingToolbar from '../meetings/MeetingToolbar.vue'

import useSpeakerSystem from './useSpeakerSystem'
import useSpeakerSystems from './useSpeakerSystems'
import SpeakerHandling from './SpeakerHandling.vue'

interface AgendaNav {
  icon: string
  to?: RouteLocationRaw
  disabled: boolean
  title?: string
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { meetingId, getMeetingRoute } = useMeeting()
const { agendaId, agendaItem, nextAgendaItem, previousAgendaItem } =
  useAgenda(meetingId)
const systemId = computed(() => Number(route.params.system))

useLoader(
  'SpeakerListsView',
  useChannel('agenda_item', agendaId).promise,
  useChannel('sls', systemId).promise
)
useMeetingTitle(t('speaker.manageLists'))

const { speakerSystem, systemActiveList } = useSpeakerSystem(systemId, agendaId)
const { allSpeakerSystems } = useSpeakerSystems(meetingId)

function getRoute(system: number, aid: number) {
  return getMeetingRoute('speakerLists', { system, aid })
}

function makeNavigation(icon: string, toAgendaItem?: AgendaItem): AgendaNav {
  return {
    icon,
    to: toAgendaItem ? getRoute(systemId.value, toAgendaItem.pk) : route.path, // Vuetify alpha.11 does not accept change to undef
    disabled: !toAgendaItem || toAgendaItem === agendaItem.value,
    title: toAgendaItem?.title
  }
}

/*
 * Navigation
 */
const navigation = computed<AgendaNav[]>(() => {
  if (!agendaItem.value) return []
  return [
    // makeNavigation('mdi-page-first', agenda.value[0]),
    makeNavigation('mdi-chevron-left', previousAgendaItem.value),
    makeNavigation('mdi-chevron-right', nextAgendaItem.value)
    // makeNavigation('mdi-page-last', agenda.value[agenda.value.length - 1])
  ]
})

function onNonInputTarget(fn: (e: KeyboardEvent) => void) {
  return (evt: KeyboardEvent) => {
    if (((evt.target as Element) || null)?.tagName === 'INPUT') return
    fn(evt)
  }
}
function toAgendaItem(ai?: AgendaItem) {
  ai && router.push(getRoute(systemId.value, ai.pk))
}
onKeyStroke(
  'ArrowLeft',
  onNonInputTarget(() => toAgendaItem(previousAgendaItem.value))
)
onKeyStroke(
  'ArrowRight',
  onNonInputTarget(() => toAgendaItem(nextAgendaItem.value))
)
/*
 * End navigation
 */

// Link to handle Agenda Item with current active list
const activeListPath = computed(() => {
  const ai = systemActiveList.value?.agenda_item
  if (!ai || ai === agendaId.value) return // Only if not current
  return getRoute(systemId.value, ai)
})
</script>

<style lang="sass">
div.speaker-lists
  .v-card
    overflow: visible
    z-index: unset

ol.speaker-queue
  margin-left: 1.2em
  li
    &.self
      font-weight: 700
</style>

<template>
  <MeetingToolbar :title="agendaItem?.title">
    <div class="mr-2">
      <v-fade-transition>
        <v-btn
          v-if="activeListPath"
          :to="activeListPath"
          variant="tonal"
          class="d-none d-md-inline-flex mr-4"
        >
          {{ t('speaker.activeList') }}
        </v-btn>
      </v-fade-transition>
      <v-btn
        v-for="(nav, i) in navigation"
        :key="i"
        v-bind="nav"
        color="black"
      />
    </div>
    <template
      #extension
      v-if="agendaItem && speakerSystem && allSpeakerSystems.length > 1"
    >
      <v-tabs color="black" align-tabs="end" class="flex-grow-1">
        <v-tab
          v-for="{ pk, title, state } in allSpeakerSystems"
          :key="pk"
          :to="getRoute(pk, agendaId)"
        >
          {{ title }}
          <v-tooltip
            v-if="state === 'inactive'"
            :text="t('inactive')"
            location="top"
          >
            <template #activator="{ props }">
              <v-icon v-bind="props" end color="secondary" start
                >mdi-eye-off</v-icon
              >
            </template>
          </v-tooltip>
        </v-tab>
      </v-tabs>
    </template>
  </MeetingToolbar>
  <SpeakerHandling v-if="systemId" :system-id="systemId" />
</template>
