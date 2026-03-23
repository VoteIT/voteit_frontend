<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { chunked, Primitive } from 'itertools'
import { computed, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import type { PickByType } from '@/utils/types'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useRules from '@/composables/useRules'

import useMeetingStore from '../meetings/useMeetingStore'
import { Meeting, MeetingState } from '../meetings/types'
import { meetingStates } from '../meetings/workflowStates'
import { translateMeetingRole } from '../meetings/utils'
import { displayRoles } from './utils'

const { t } = useI18n()
const meetingStore = useMeetingStore()
const rules = useRules(t)

const INCLUDE_STATES = [MeetingState.Ongoing, MeetingState.Upcoming]

function getInitialStates() {
  // If no ongoing or upcoming meetings, default to showing closed meetings
  const sCount = meetingStore.stateCount
  return MeetingState.Ongoing in sCount || MeetingState.Upcoming in sCount
    ? INCLUDE_STATES.filter((s) => s in sCount)
    : [MeetingState.Closed].filter((s) => s in sCount)
}

const searchFilter = reactive<{
  order: keyof PickByType<Meeting, Primitive>
  search: string
  states: MeetingState[]
  year: number | null
}>({
  order: 'title',
  search: '',
  states: getInitialStates(),
  year: null
})

const currentSearchPage = shallowRef(1)
const searchedMeetings = computed(() =>
  meetingStore.filterMeetings(
    searchFilter.states,
    searchFilter.order,
    searchFilter.search,
    searchFilter.year
  )
)
const chunkedMeetings = computed(() => [...chunked(searchedMeetings.value, 10)])
watch(searchedMeetings, () => {
  currentSearchPage.value = 1
})

const yearItems = computed(() => [
  {
    value: null,
    title: t('organization.allYears')
  },
  ...meetingStore.existingMeetingYears.map((value) => ({
    value,
    title: value.toFixed()
  }))
])

const stateItems = computed(() =>
  meetingStates
    .filter(({ state }) => state in meetingStore.stateCount)
    .map(({ state, getName }) => {
      const count = meetingStore.stateCount[state]!
      return {
        value: state,
        title: `${getName(t, count)} (${count})`
      }
    })
)

const searchInfo = computed<
  { type: 'info' | 'warning'; text: string } | undefined
>(() => {
  if (searchedMeetings.value.length) return
  if (!meetingStore.hasVisibleMeetings) {
    return {
      type: 'info',
      text: t('home.noVisibleMeetings')
    }
  }
  if (!searchFilter.states.length) {
    return {
      type: 'warning',
      text: t('home.noMeetingStates')
    }
  }
  return {
    type: 'info',
    text: t('home.noMatchingMeetings')
  }
})
</script>

<template>
  <DefaultDialog :title="$t('meeting.find')">
    <template #activator="{ props }">
      <v-btn
        block
        color="primary"
        prepend-icon="mdi-calendar-plus"
        size="x-large"
        :text="$t('meeting.find')"
        variant="elevated"
        v-bind="props"
      />
    </template>
    <v-select
      :label="$t('state')"
      chips
      closable-chips
      density="comfortable"
      :items="stateItems"
      v-model="searchFilter.states"
      multiple
      hide-details
      class="mb-1"
      :rules="[rules.required]"
    />
    <div class="d-flex mb-1">
      <v-text-field
        :label="$t('search')"
        v-model="searchFilter.search"
        class="mr-1"
        hide-details
        clearable
      />
      <v-select
        :label="$t('meeting.yearStarted')"
        :items="yearItems"
        v-model="searchFilter.year"
        hide-details
      />
    </div>

    <v-alert v-if="searchInfo" class="mt-4" prominent v-bind="searchInfo" />

    <v-pagination
      v-if="chunkedMeetings.length > 1"
      v-model="currentSearchPage"
      :length="chunkedMeetings.length"
    />
    <v-list v-if="chunkedMeetings.length">
      <v-list-item
        v-for="{ pk, title, state, current_user_roles } in chunkedMeetings[
          currentSearchPage - 1
        ]"
        :key="pk"
        :title="title"
        :subtitle="meetingStates.find((s) => s.state === state)?.getName(t)"
        :to="
          current_user_roles
            ? {
                name: 'meeting',
                params: { id: pk, slug: slugify(title) }
              }
            : undefined
        "
      >
        <template #append v-if="current_user_roles">
          <v-tooltip
            v-for="{ role, icon } in displayRoles"
            :key="role"
            :text="translateMeetingRole(role, t)"
          >
            <template
              #activator="{ props }"
              v-if="current_user_roles?.includes(role)"
            >
              <v-icon v-bind="props" :icon="icon" />
            </template>
          </v-tooltip>
        </template>
        <template v-else #append>
          <v-btn
            append-icon="mdi-arrow-right-circle"
            color="primary"
            :text="$t('join.meeting')"
            :to="{
              name: 'meeting:join',
              params: { id: pk, slug: slugify(title) }
            }"
            variant="tonal"
          />
        </template>
      </v-list-item>
    </v-list>
  </DefaultDialog>
</template>
