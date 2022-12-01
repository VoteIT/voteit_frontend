<template>
  <v-row v-if="organisation" class="home mt-4 mb-4">
    <v-col v-if="!isAuthenticated" cols="12" order-sm="1" sm="4" xl="3">
      <v-btn block v-if="organisation.login_url" color="primary" :href="idLoginURL" prepend-icon="mdi-login">
        {{ t('organization.loginTo', { ...organisation }) }}
      </v-btn>
    </v-col>
    <v-col cols="12" order-md="0" md="8" lg="6" offset-lg="1" xl="5" offset-xl="2">
      <v-tabs v-if="tabs" v-model="currentTab" :items="tabs" align-tabs="end" class="mb-4" />
      <v-window v-model="currentTab">
        <v-window-item value="default">
          <header class="d-flex">
            <Headline v-model="changeForm.page_title" :editing="editing" class="flex-grow-1" />
            <DropdownMenu :items="menu" />
          </header>
          <Richtext v-model="changeForm.body" :editing="editing" @edit-done="save()" variant="full" :maxHeight="collapsedBodyHeightMobile" />
        </v-window-item>
        <v-window-item value="roles" v-if="canChangeOrganisation">
          <UserSearch class="mb-6" @submit="addUser" />
          <RoleMatrix admin :contentType="organisationType" :pk="organisation.pk" :icons="organisationIcons" />
        </v-window-item>
      </v-window>
    </v-col>
    <v-divider vertical />
    <v-col v-if="isAuthenticated" cols="12" md="4" xl="3">
      <div v-if="userMeetingInvites.length" class="mb-4">
        <h2 class="mb-2">
          {{ t('join.invites', userMeetingInvites.length) }}
        </h2>
        <Invite v-for="inv in userMeetingInvites" :key="inv.pk" :invite="inv" class="mb-4" />
      </div>
      <h2 class="mb-3">
        {{ t('home.yourMeetings', meetingCount) }}
      </h2>
      <div v-for="{ expandable, meetings, title } in meetingGroups" :key="title">
        <h3>
          {{ title }}
        </h3>
        <v-list class="my-3" border rounded>
          <v-list-item
            v-for="{ pk, start_time, title, current_user_roles } in meetings"
            :key="pk"
            :to="`/m/${pk}/${slugify(title)}`"
            :title="title"
            :subtitle="start_time?.toLocaleDateString()"
          >
            <template #append>
              <v-tooltip v-for="{ role, icon } in displayRoles" :key="role" :text="t(`role.${role}`)">
                <template #activator="{ props }" v-if="current_user_roles?.includes(role)">
                  <v-icon v-bind="props" :icon="icon" />
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
          <v-btn block v-if="expandable && !groupsExpanded" @click="groupsExpanded = true" variant="text">
            {{ t('organization.showMore') }}
          </v-btn>
        </v-list>
      </div>
      <p v-if="!meetingGroups.length" class="mb-4"><em>{{ t('home.noCurrentMeetings') }}</em></p>
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
          <AddMeeting @close="isActive.value=false" />
        </template>
      </DefaultDialog>
      <DefaultDialog v-if="otherMeetingsExist" :title="t('meeting.find')">
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
        <div class="d-flex">
          <v-text-field :label="t('search')" v-model="searchFilter.search" class="mr-1" hide-details clearable />
          <v-select :label="t('meeting.yearStarted')" :items="yearItems" v-model="searchFilter.year" hide-details />
        </div>
        <div class="d-flex">
          <v-switch
            :label="t('organization.searchClosedMeetings')"
            v-model="searchFilter.includeClosed"
            color="primary"
          />
          <v-switch
            :label="t('organization.searchDeletingMeetings')"
            v-model="searchFilter.includeDeleting"
            color="primary"
          />
          <v-switch
            :label="t('organization.searchArchivedMeetings')"
            v-model="searchFilter.includeArchived"
            color="primary"
          />
        </div>
        <v-pagination v-if="searchedMeetings.length > 1" v-model="currentSearchPage" :length="searchedMeetings.length" />
        <v-list>
          <v-list-item
            v-for="{ pk, title, state, current_user_roles } in searchedMeetings[currentSearchPage - 1]"
            :key="pk"
            :title="title"
            :subtitle="t(`workflowState.${state}`)"
            :to="current_user_roles ? `/m/${pk}/${slugify(title)}` : undefined"
            >
            <template #append v-if="current_user_roles">
              <v-tooltip v-for="{ role, icon } in displayRoles" :key="role" :text="t(`role.${role}`)">
                <template #activator="{ props }" v-if="current_user_roles?.includes(role)">
                  <v-icon v-bind="props" :icon="icon" />
                </template>
              </v-tooltip>
            </template>
            <template v-else #append>
              <v-btn :to="`/join/${pk}/${slugify(title)}`" append-icon="mdi-arrow-right-circle" color="primary" variant="tonal">
                {{ t('join.meeting') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </DefaultDialog>
    </v-col>
  </v-row>

</template>

<script lang="ts" setup>
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

import AddMeeting from '../meetings/AddMeetingModal.vue'
import useMeetings from '../meetings/useMeetings'
import useMeetingInvites from '../meetings/useMeetingInvites'
import Invite from '../meetings/Invite.vue'
import useOrganisation from './useOrganisation'
import useOrganisations from './useOrganisations'
import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import { Meeting, MeetingState, MeetingRole } from '../meetings/types'
import { chunk } from 'lodash'
import DefaultDialog from '@/components/DefaultDialog.vue'

const { userMeetingInvites, clearInvites, fetchInvites } = useMeetingInvites()

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { t } = useI18n()
const { isAuthenticated, user } = useAuthentication()
const { fetchOrganisations } = useOrganisations()
const { canAddMeeting, canChangeOrganisation, idLoginURL, organisation, organisationId } = useOrganisation()
const loader = useLoader('Home')
const { existingMeetingYears, participatingClosedMeetings, participatingOngoingMeetings, participatingUpcomingMeetings, otherMeetingsExist, filterMeetings } = useMeetings(loader.call)

const currentTab = ref('default')
const subscribeOrganisationId = computed(() => {
  if (currentTab.value !== 'roles') return
  return organisationId.value
})
useLoader(
  'Home',
  useChannel('organisation', subscribeOrganisationId, { leaveOnUnmount: true }).promise
)
useTitle(computed(() => organisation.value ? `${organisation.value.title} | VoteIT` : 'VoteIT'))

function fetchInvitesIfAuthenticated () {
  if (user.value) fetchInvites()
}

watch(user, () => {
  clearInvites()
  fetchInvitesIfAuthenticated()
})
const { idle } = useIdle()
useIntervalFn(
  fetchInvitesIfAuthenticated,
  computed(() => idle.value ? 600_000 : 15_000),
  { immediateCallback: true }
)

onBeforeMount(() => {
  // App.vue loads organisation data at first load
  // Call again to update page content
  if (loader.initDone.value) fetchOrganisations()
})

const editing = ref(false)
const changeForm = reactive({
  page_title: organisation.value?.page_title ?? '',
  body: organisation.value?.body ?? ''
})
watch(organisation, org => {
  changeForm.page_title = org?.page_title ?? ''
  changeForm.body = org?.body ?? ''
})
const menu = computed<MenuItem[]>(() => {
  if (!organisation.value || !canChangeOrganisation.value) return []
  return [
    {
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => { editing.value = true }
    }
  ]
})
const tabs = computed(() => {
  if (!canChangeOrganisation.value) return
  return [
    {
      value: 'default',
      title: 'Hem'
    },
    {
      value: 'roles',
      title: 'Roller'
    }
  ]
})

async function save () {
  if (!organisation.value) throw new Error('No organisation')
  await organisationType.api.patch(organisation.value.pk, changeForm)
  editing.value = false
}

function addUser (user: number) {
  if (!organisation.value) throw new Error('No organisation')
  organisationType.addRoles(organisation.value.pk, user, OrganisationRole.MeetingCreator)
}

const { collapsedBodyHeightMobile } = useDefaults()

/* Meetings listed upfront */
const groupRules = [
  {
    meetings: participatingOngoingMeetings,
    translationString: 'workflowState.plural.ongoing'
  },
  {
    meetings: participatingUpcomingMeetings,
    translationString: 'workflowState.plural.upcoming'
  },
  {
    meetings: participatingClosedMeetings,
    translationString: 'workflowState.plural.closed',
    maxLength: 3
  }
]
const meetingGroups = computed(() => {
  return groupRules
    .map(({ maxLength, meetings, translationString }) => {
      return {
        meetings: maxLength && !groupsExpanded.value
          ? meetings.value.slice(0, maxLength)
          : meetings.value,
        title: t(translationString),
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
const meetingCount = computed(() => groupRules.reduce((acc, { meetings }) => acc + meetings.value.length, 0))

/* Meeting search */
const yearItems = computed(() => {
  return [
    {
      value: null,
      title: t('organization.allYears')
    },
    ...existingMeetingYears.value.map(value => ({ value, title: value.toFixed() }))
  ]
})
const searchFilter = reactive<{ includeArchived: boolean, includeClosed: boolean, includeDeleting: boolean, search: string, year: number | null, order: keyof Meeting }>({
  includeArchived: false,
  includeClosed: false,
  includeDeleting: false,
  order: 'title',
  search: '',
  year: null
})
function getSearchStates () {
  const states: MeetingState[] = Object.values(MeetingState)
  // I'm sure there's a smarter way to do this :P
  if (!searchFilter.includeArchived) {
    states.splice(states.indexOf(MeetingState.Archived), 1)
    states.splice(states.indexOf(MeetingState.Archiving), 1)
  }
  if (!searchFilter.includeClosed) states.splice(states.indexOf(MeetingState.Closed), 1)
  if (!searchFilter.includeDeleting) states.splice(states.indexOf(MeetingState.Deleting), 1)
  return states
}

const currentSearchPage = ref(1)
const searchedMeetings = computed(() => {
  const meetings = filterMeetings(getSearchStates(), searchFilter.order, searchFilter.search, searchFilter.year)
  return chunk(meetings, 10)
})
watch(searchedMeetings, () => { currentSearchPage.value = 1 })
</script>
