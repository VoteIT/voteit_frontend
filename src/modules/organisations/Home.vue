<template>
  <v-row v-if="organisation" class="home mt-4 mb-4">
    <v-col v-if="!isAuthenticated" cols="12" order-sm="1" sm="4" xl="3">
      <v-btn block v-if="organisation.login_url" color="primary" :href="idLoginURL" prepend-icon="mdi-login">
        {{ t('organization.loginTo', { ...organisation }) }}
      </v-btn>
    </v-col>
    <v-col cols="12" order-md="0" md="8" lg="6" offset-lg="1" xl="5" offset-xl="2">
      <v-tabs v-if="tabs" v-model="currentTab" :items="tabs" end class="mb-4" />
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
        <Invite v-for="inv in userMeetingInvites" :key="inv.pk" :invite="inv" />
      </div>
      <h2>
        {{ t('home.yourMeetings', participatingOngoingMeetings.length) }}
      </h2>
      <v-list v-if="participatingOngoingMeetings.length" class="my-4" border rounded>
        <template v-if="participatingOngoingMeetings.length">
          <v-list-subheader :title="t('workflowState.ongoing')" />
          <v-list-item v-for="{ pk, title, current_user_roles } in participatingOngoingMeetings" :key="pk" :to="`/m/${pk}/${slugify(title)}`" :title="title" :subtitle="current_user_roles?.map(r => t(`role.${r}`)).join(', ')" />
        </template>
        <v-divider v-if="participatingOngoingMeetings.length && participatingUpcomingMeetings.length" class="my-3" />
        <template v-if="participatingUpcomingMeetings.length">
          <v-list-subheader :title="t('workflowState.upcoming')" />
          <v-list-item v-for="{ pk, title, current_user_roles } in participatingUpcomingMeetings" :key="pk" :to="`/m/${pk}/${slugify(title)}`" :title="title" :subtitle="current_user_roles?.map(r => t(`role.${r}`)).join(', ')" />
        </template>
      </v-list>
      <p v-else class="mb-4"><em>{{ t('home.noCurrentMeetings') }}</em></p>
      <v-dialog v-if="canAddMeeting">
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
          <v-sheet class="pa-4" v-bind="dialogDefaults">
            <div class="d-flex mb-2">
              <h2 class="flex-grow-1">
                {{ t('meeting.create') }}
              </h2>
              <v-btn class="mt-n2 mr-n2" icon="mdi-close" variant="text" @click="isActive.value=false" />
            </div>
            <AddMeeting @close="isActive.value=false" />
          </v-sheet>
        </template>
      </v-dialog>
      <v-dialog v-if="otherMeetingsExist">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            block
            variant="text"
            color="primary"
            prepend-icon="mdi-calendar-plus"
          >
            {{ t('meeting.find') }}
          </v-btn>
        </template>
        <v-sheet class="pa-4" v-bind="dialogDefaults" min-height="60vh">
          <h2 class="mb-2">
            {{ t('meeting.find') }}
          </h2>
          <div class="d-flex">
            <v-text-field :label="t('search')" v-model="searchFilter.search" class="mr-1" />
            <v-select :label="t('meeting.yearStarted')" :items="yearItems" v-model="searchFilter.year" />
          </div>
          <v-chip-group v-model="searchFilter.states" multiple>
            <v-chip
              v-for="state in Object.values(MeetingState)"
              :key="state"
              :value="state"
              :text="t(`workflowState.${state}`)"
              color="primary"
            />
          </v-chip-group>
          <v-pagination v-if="searchedMeetings.length > 1" v-model="currentSearchPage" :length="searchedMeetings.length" />
          <v-list>
            <v-list-item
              v-for="{ pk, title, state, current_user_roles } in searchedMeetings[currentSearchPage - 1]"
              :key="pk"
              :title="title"
              :subtitle="t(`workflowState.${state}`)"
            >
              <template #append>
                <v-btn
                  v-if="current_user_roles"
                  color="success-darken-2"
                  :to="`/m/${pk}/${slugify(title)}`"
                  append-icon="mdi-arrow-right-bold"
                >
                  {{ t('meeting.to') }}
                </v-btn>
                <v-btn
                  v-else
                  color="primary"
                  :to="`/join/${pk}/${slugify(title)}`"
                  append-icon="mdi-door-open"
                >
                  {{ t('join.meeting') }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-dialog>
      <!-- <div v-if="otherOngoingMeetings.length">
        <h2>
          {{ t('join.joinAMeeting', otherOngoingMeetings.length) }}
        </h2>
        <v-list v-if="otherOngoingMeetings.length" class="mb-4">
          <v-list-item v-for="meeting in otherOngoingMeetings" :key="meeting.pk" :to="`/join/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t('workflowState.ongoing')" />
        </v-list>
        <p v-if="!otherOngoingMeetings.length"><em>
          {{ t('home.noCurrentMeetings') }}
        </em></p>
      </div> -->
    </v-col>
  </v-row>

</template>

<script lang="ts" setup>
import { computed, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

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
import { ContextRoles } from '@/composables/types'

import AddMeeting from '../meetings/AddMeetingModal.vue'
import useMeetings from '../meetings/useMeetings'
import useMeetingInvites from '../meetings/useMeetingInvites'
import Invite from '../meetings/Invite.vue'
import useOrganisation from './useOrganisation'
import useOrganisations from './useOrganisations'
import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import { Meeting, MeetingState } from '../meetings/types'
import { chunk } from 'lodash'

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
const { existingMeetingYears, participatingOngoingMeetings, participatingUpcomingMeetings, otherMeetingsExist, filterMeetings } = useMeetings(loader.call)

const currentTab = ref('default')
const subscribeOrganisationId = computed(() => {
  if (currentTab.value !== 'roles') return
  return organisationId.value
})
useChannel('organisation', subscribeOrganisationId, { leaveOnUnmount: true })
useTitle(computed(() => organisation.value ? `${organisation.value.title} | VoteIT` : 'VoteIT'))

watch(user, value => {
  clearInvites()
  if (value) fetchInvites()
})

onBeforeMount(() => {
  // App.vue loads organisation data at first load
  // Call again to update page content
  if (loader.initDone.value) fetchOrganisations()
})

// const participatingMeetings = computed(() => orderedMeetings.value.filter(m => m.current_user_roles))
// const otherMeetings = computed(() => orderedMeetings.value.filter(m => !m.current_user_roles))

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
      icon: 'mdi-pencil',
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

function addUser (user: ContextRoles) {
  if (!organisation.value) throw new Error('No organisation')
  organisationType.addRoles(organisation.value.pk, user.pk, OrganisationRole.MeetingCreator)
}

const { dialogDefaults, collapsedBodyHeightMobile } = useDefaults()

const yearItems = computed(() => existingMeetingYears.value.map(value => ({ value: value || null, title: value ? String(value) : '-' })))
const searchFilter = reactive<{ search: string, year: number | null, states: MeetingState[], order: keyof Meeting }>({
  search: '',
  year: null,
  states: [MeetingState.Ongoing, MeetingState.Upcoming],
  order: 'title'
})

const currentSearchPage = ref(1)
const searchedMeetings = computed(() => {
  const meetings = filterMeetings(searchFilter.states, searchFilter.order, searchFilter.search, searchFilter.year)
  return chunk(meetings, 8)
})
watch(searchedMeetings, () => { currentSearchPage.value = 1 })
</script>
