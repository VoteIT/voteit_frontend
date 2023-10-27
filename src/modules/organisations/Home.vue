<script lang="ts" setup>
import { chunk } from 'lodash'
import { DateTime } from 'luxon'
import { computed, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle, useIntervalFn, useTitle } from '@vueuse/core'

import { slugify } from '@/utils'
import { MenuItem } from '@/utils/types'

import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'
import useAuthentication from '@/composables/useAuthentication'
import useChannel from '@/composables/useChannel'
import useDefaults from '@/composables/useDefaults'
import useLoader from '@/composables/useLoader'
import DefaultDialog from '@/components/DefaultDialog.vue'
import EditableHelpText from '@/components/EditableHelpText.vue'
import useRules from '@/composables/useRules'
import AddMeeting from '../meetings/AddMeetingModal.vue'
import useMeetings from '../meetings/useMeetings'
import useMeetingInvites from '../meetings/useMeetingInvites'
import Invite from '../meetings/Invite.vue'
import { Meeting, MeetingState, MeetingRole } from '../meetings/types'
import { translateMeetingRole } from '../meetings/utils'
import { meetingStates } from '../meetings/workflowStates'

import ContactInfoTab from './ContactInfoTab.vue'
import useOrganisation from './useOrganisation'
import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'

const { userMeetingInvites, clearInvites, fetchInvites } = useMeetingInvites()

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { t } = useI18n()
const { isAuthenticated, user } = useAuthentication()
const {
  canAddMeeting,
  canChangeOrganisation,
  idLoginURL,
  organisation,
  organisationId,
  organisationIsUnavailable,
  fetchOrganisation
} = useOrganisation()

const currentTab = ref('default')
const subscribeOrganisationId = computed(() => {
  if (currentTab.value !== 'roles') return
  return organisationId.value
})
const loader = useLoader(
  'Home',
  useChannel('organisation', subscribeOrganisationId).promise
)

const {
  existingMeetingYears,
  meetings,
  meetingStateCount,
  participatingClosedMeetings,
  participatingOngoingMeetings,
  participatingUpcomingMeetings,
  otherMeetingsExist,
  filterMeetings
} = useMeetings(loader.call)
const rules = useRules(t)

useTitle(
  computed(() =>
    organisation.value ? `${organisation.value.title} | VoteIT` : 'VoteIT'
  )
)

function fetchInvitesIfAuthenticated() {
  if (user.value) fetchInvites()
}

watch(user, () => {
  clearInvites()
  fetchInvitesIfAuthenticated()
})
const { idle } = useIdle()
useIntervalFn(
  fetchInvitesIfAuthenticated,
  computed(() => (idle.value ? 600_000 : 15_000)),
  { immediateCallback: true }
)

onBeforeMount(() => {
  // App.vue loads organisation data at first load
  // Call again to update page content
  if (loader.initDone.value) fetchOrganisation()
})

const editing = ref(false)
const changeForm = reactive({
  body: organisation.value?.body ?? '',
  page_title: organisation.value?.page_title ?? ''
})
watch(organisation, (org) => {
  changeForm.body = org?.body ?? ''
  changeForm.page_title = org?.page_title ?? ''
})

const menu = computed<MenuItem[]>(() => {
  if (!organisation.value || !canChangeOrganisation.value) return []
  return [
    {
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => {
        editing.value = true
      }
    }
  ]
})
const tabs = computed(() => {
  if (!canChangeOrganisation.value) return
  return [
    {
      value: 'default',
      text: t('home.home')
    },
    {
      value: 'roles',
      text: t('roles')
    },
    {
      value: 'contactInfo',
      text: t('home.contactInfo.title')
    }
  ]
})

async function save() {
  if (!organisationId.value) throw new Error('No organisation')
  await organisationType.api.patch(organisationId.value, changeForm)
  editing.value = false
}

async function saveHelpText(text: string) {
  if (!organisationId.value) throw new Error('No organisation')
  await organisationType.api.patch(organisationId.value, { help_info: text })
}

function addUser(user: number) {
  if (!organisation.value) throw new Error('No organisation')
  organisationType.addRoles(
    organisation.value.pk,
    user,
    OrganisationRole.MeetingCreator
  )
}

const { collapsedBodyHeightMobile, cols } = useDefaults()

/* Meetings listed upfront */
const groupRules = [
  {
    meetings: participatingOngoingMeetings,
    state: meetingStates.find((s) => s.state === MeetingState.Ongoing)!
  },
  {
    meetings: participatingUpcomingMeetings,
    state: meetingStates.find((s) => s.state === MeetingState.Upcoming)!
  },
  {
    meetings: participatingClosedMeetings,
    state: meetingStates.find((s) => s.state === MeetingState.Closed)!,
    maxLength: 3
  }
]
const meetingGroups = computed(() => {
  return groupRules
    .map(({ maxLength, meetings, state }) => {
      return {
        meetings:
          maxLength && !groupsExpanded.value
            ? meetings.value.slice(0, maxLength)
            : meetings.value,
        title: state.getName(t, meetings.value.length),
        expandable: !!maxLength && meetings.value.length > maxLength
      }
    })
    .filter(({ meetings }) => meetings.length)
})
const groupsExpanded = ref(false)
const displayRoles = [
  { role: MeetingRole.PotentialVoter, icon: 'mdi-star-outline' },
  { role: MeetingRole.Moderator, icon: 'mdi-gavel' }
]
const meetingCount = computed(() =>
  groupRules.reduce((acc, { meetings }) => acc + meetings.value.length, 0)
)

/* Meeting search */
const yearItems = computed(() => {
  return [
    {
      value: null,
      title: t('organization.allYears')
    },
    ...existingMeetingYears.value.map((value) => ({
      value,
      title: value.toFixed()
    }))
  ]
})
const stateItems = computed(() => {
  return meetingStates
    .filter(({ state }) => state in meetingStateCount.value)
    .map(({ state, getName }) => {
      const count = meetingStateCount.value[state]!
      return {
        value: state,
        title: `${getName(t, count)} (${count})`
      }
    })
})
const INCLUDE_STATES = [MeetingState.Ongoing, MeetingState.Upcoming]
const searchFilter = reactive<{
  search: string
  states: MeetingState[]
  year: number | null
  order: keyof Meeting
}>({
  order: 'title',
  search: '',
  states: [],
  year: null
})
watch(meetingStateCount, (value) => {
  // If no ongoing or upcoming meetings, default to showing closed meetings
  searchFilter.states =
    MeetingState.Ongoing in value || MeetingState.Upcoming in value
      ? INCLUDE_STATES.filter((s) => s in value)
      : [MeetingState.Closed].filter((s) => s in value)
})

const currentSearchPage = ref(1)
const searchedMeetings = computed(() =>
  filterMeetings(
    searchFilter.states,
    searchFilter.order,
    searchFilter.search,
    searchFilter.year
  )
)
const chunkedMeetings = computed(() => chunk(searchedMeetings.value, 10))
watch(searchedMeetings, () => {
  currentSearchPage.value = 1
})

const searchInfo = computed<
  { type: 'info' | 'warning'; text: string } | undefined
>(() => {
  if (searchedMeetings.value.length) return
  if (!meetings.size) {
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
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row v-if="organisation" class="home mt-4 mb-4">
        <v-col v-if="!isAuthenticated" cols="12" order-sm="1" sm="4" xl="3">
          <v-btn
            block
            v-if="organisation.login_url"
            color="primary"
            :href="idLoginURL"
            prepend-icon="mdi-login"
          >
            {{ t('organization.loginTo', { ...organisation }) }}
          </v-btn>
          <EditableHelpText :modelValue="organisation.help_info" class="mt-3" />
        </v-col>
        <v-col
          cols="12"
          order-md="0"
          md="8"
          lg="6"
          offset-lg="1"
          xl="5"
          offset-xl="2"
        >
          <v-tabs
            v-if="tabs"
            v-model="currentTab"
            :items="tabs"
            align-tabs="end"
            class="mb-4"
          />
          <v-window v-model="currentTab">
            <v-window-item value="default">
              <header class="d-flex">
                <Headline
                  v-model="changeForm.page_title"
                  :editing="editing"
                  class="flex-grow-1"
                />
                <DropdownMenu :items="menu" />
              </header>
              <Richtext
                v-model="changeForm.body"
                :editing="editing"
                @edit-done="save()"
                variant="full"
                :maxHeight="collapsedBodyHeightMobile"
              />
            </v-window-item>

            <template v-if="canChangeOrganisation">
              <v-window-item value="roles">
                <UserSearch class="mb-6" @submit="addUser" />
                <RoleMatrix
                  admin
                  :contentType="organisationType"
                  :pk="organisation.pk"
                  :icons="organisationIcons"
                />
              </v-window-item>

              <v-window-item value="contactInfo">
                <ContactInfoTab />
              </v-window-item>
            </template>
          </v-window>
        </v-col>
        <v-divider vertical />
        <v-col v-if="isAuthenticated" cols="12" md="4" xl="3">
          <div v-if="userMeetingInvites.length" class="mb-4">
            <h2 class="mb-2">
              {{ t('join.invites', userMeetingInvites.length) }}
            </h2>
            <Invite
              v-for="inv in userMeetingInvites"
              :key="inv.pk"
              :invite="inv"
              class="mb-4"
            />
          </div>
          <h2 class="mb-3">
            {{ t('home.yourMeetings', meetingCount) }}
          </h2>
          <div
            v-for="{ expandable, meetings, title } in meetingGroups"
            :key="title"
          >
            <h3>
              {{ title }}
            </h3>
            <v-list class="my-3" :border="true" rounded>
              <v-list-item
                v-for="{
                  pk,
                  start_time,
                  title,
                  current_user_roles
                } in meetings"
                :key="pk"
                :to="{
                  name: 'meeting',
                  params: { id: pk, slug: slugify(title) }
                }"
                :title="title"
                :subtitle="
                  start_time
                    ? DateTime.fromISO(start_time).toLocaleString()
                    : undefined
                "
              >
                <template #append>
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
              </v-list-item>
              <v-btn
                block
                v-if="expandable && !groupsExpanded"
                @click="groupsExpanded = true"
                variant="text"
              >
                {{ t('organization.showMore') }}
              </v-btn>
            </v-list>
          </div>
          <p v-if="!meetingGroups.length" class="mb-4">
            <em>{{ t('home.noCurrentMeetings') }}</em>
          </p>
          <DefaultDialog v-if="canAddMeeting" :title="t('meeting.create')">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                block
                prepend-icon="mdi-plus"
                variant="text"
                color="primary"
              >
                {{ t('meeting.create') }}
              </v-btn>
            </template>
            <template v-slot="{ isActive }">
              <AddMeeting @close="isActive.value = false" />
            </template>
          </DefaultDialog>
          <DefaultDialog
            v-if="otherMeetingsExist"
            :title="t('meeting.find')"
            height="80vh"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                block
                variant="elevated"
                color="primary"
                prepend-icon="mdi-calendar-plus"
                size="x-large"
              >
                {{ t('meeting.find') }}
              </v-btn>
            </template>
            <v-select
              :label="t('state')"
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
                :label="t('search')"
                v-model="searchFilter.search"
                class="mr-1"
                hide-details
                clearable
              />
              <v-select
                :label="t('meeting.yearStarted')"
                :items="yearItems"
                v-model="searchFilter.year"
                hide-details
              />
            </div>

            <v-alert
              v-if="searchInfo"
              class="mt-4"
              prominent
              v-bind="searchInfo"
            />

            <v-pagination
              v-if="chunkedMeetings.length > 1"
              v-model="currentSearchPage"
              :length="chunkedMeetings.length"
            />
            <v-list v-if="chunkedMeetings.length">
              <v-list-item
                v-for="{
                  pk,
                  title,
                  state,
                  current_user_roles
                } in chunkedMeetings[currentSearchPage - 1]"
                :key="pk"
                :title="title"
                :subtitle="
                  meetingStates.find((s) => s.state === state)?.getName(t)
                "
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
                    :to="{
                      name: 'meetingJoin',
                      params: { id: pk, slug: slugify(title) }
                    }"
                    append-icon="mdi-arrow-right-circle"
                    color="primary"
                    variant="tonal"
                  >
                    {{ t('join.meeting') }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </DefaultDialog>

          <EditableHelpText
            :modelValue="organisation.help_info"
            :editable="!!canChangeOrganisation"
            :handler="saveHelpText"
            :placeholder="t('home.helpInfoPlaceholder')"
            class="mt-3"
          />
        </v-col>
      </v-row>
      <v-row v-else-if="organisationIsUnavailable">
        <v-col v-bind="cols">
          <v-sheet class="py-8 px-4 text-center" :border="true" rounded>
            <h1 class="mb-4 flex-grow-1">
              {{ t('home.noOrganisationTitle') }}
            </h1>
            <p class="mb-12">
              {{ t('home.noOrganisationDescription') }}
            </p>
            <p>
              <i18n-t keypath="home.noOrganisationTryItOut">
                <template #projectURL>
                  <a href="https://voteit.se">VoteIT.se</a>
                </template>
              </i18n-t>
            </p>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
