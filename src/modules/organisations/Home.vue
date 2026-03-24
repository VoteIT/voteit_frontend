<script lang="ts" setup>
import { imap, sum } from 'itertools'
import { DateTime } from 'luxon'
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle, useIntervalFn, useTitle } from '@vueuse/core'

import { slugify } from '@/utils'
import { cols } from '@/utils/defaults'
import { MenuItem } from '@/utils/types'

import AppBar from '@/components/AppBar.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserMenu from '@/components/UserMenu.vue'
import UserSearch from '@/components/UserSearch.vue'
import useChannel from '@/composables/useChannel'
import useDefaults from '@/composables/useDefaults'
import useLoader from '@/composables/useLoader'
import DefaultDialog from '@/components/DefaultDialog.vue'
import EditableHelpText from '@/components/EditableHelpText.vue'

import useAuthStore from '../auth/useAuthStore'
import useInviteStore from '../meetingInvites/useInviteStore'
import AddMeeting from '../meetings/AddMeetingModal.vue'
import useMeetings from '../meetings/useMeetings'
import Invite from '../meetingInvites/Invite.vue'
import { MeetingState } from '../meetings/types'
import { translateMeetingRole } from '../meetings/utils'
import { meetingStates } from '../meetings/workflowStates'
import useMeetingStore from '../meetings/useMeetingStore'

import ContactInfoTab from './ContactInfoTab.vue'
import useOrgStore from './useOrgStore'
import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import useContactInfo from './useContactInfo'
import FindMeetingDialog from './FindMeetingDialog.vue'
import { displayRoles } from './utils'

const inviteStore = useInviteStore()

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { t } = useI18n()
const { isAuthenticated, user } = storeToRefs(useAuthStore())
const orgStore = useOrgStore()
const meetingStore = useMeetingStore()
const {
  participatingClosedMeetings,
  participatingOngoingMeetings,
  participatingUpcomingMeetings
} = storeToRefs(meetingStore)

const currentTab = ref('default')
const subscribeOrganisationId = computed(() => {
  if (currentTab.value !== 'roles') return
  return orgStore.organisation?.pk
})
const loader = useLoader(
  'Home',
  useChannel('organisation', subscribeOrganisationId).promise
)

useMeetings(loader.call)

const { requiresCheck } = useContactInfo(true)

useTitle(
  computed(() =>
    orgStore.organisation ? `${orgStore.organisation.title} | VoteIT` : 'VoteIT'
  )
)

async function fetchInvitesIfAuthenticated() {
  if (!user.value) return
  await inviteStore.fetchMatchedInvites()
}

watch(user, () => {
  inviteStore.clearMatchedInvites()
  fetchInvitesIfAuthenticated()
})
const { idle } = useIdle()
useIntervalFn(
  fetchInvitesIfAuthenticated,
  computed(() => (idle.value ? 600_000 : 15_000)),
  { immediateCallback: true }
)

onBeforeMount(async () => {
  // App.vue loads organisation data at first load
  // Call again to update page content
  if (!loader.initDone.value) return
  try {
    await orgStore.fetchOrganisation()
  } catch {
    // Ignore org fetch here. We should already have data, so it's just an update that failed.
  }
})

const editing = ref(false)
const changeForm = reactive({
  body: orgStore.organisation?.body ?? '',
  page_title: orgStore.organisation?.page_title ?? ''
})
watch(
  () => orgStore.organisation,
  (org) => {
    changeForm.body = org?.body ?? ''
    changeForm.page_title = org?.page_title ?? ''
  }
)

const menu = computed<MenuItem[]>(() => {
  if (!orgStore.organisation || !orgStore.canChangeOrganisation) return []
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
  if (!orgStore.canChangeOrganisation) return
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
  if (formChanged.value) await orgStore.updateOrganisation(changeForm)
  editing.value = false
}

function addUser(user: number) {
  if (!orgStore.organisation) throw new Error('No organisation')
  organisationType.addRoles(
    orgStore.organisation.pk,
    user,
    OrganisationRole.MeetingCreator
  )
}

const { collapsedBodyHeightMobile } = useDefaults()

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
const meetingCount = computed(() =>
  sum(imap(groupRules, ({ meetings }) => meetings.value.length))
)

const formChanged = computed(
  () =>
    changeForm.body !== orgStore.organisation?.body ||
    changeForm.page_title !== orgStore.organisation.page_title
)

function cancelEdit() {
  editing.value = false
  if (!orgStore.organisation) return
  changeForm.body = orgStore.organisation.body
  changeForm.page_title = orgStore.organisation.page_title
}
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row v-if="orgStore.organisation" class="home mt-4 mb-4">
        <v-col v-if="!isAuthenticated" cols="12" order-sm="1" sm="4" xl="3">
          <v-btn
            v-if="orgStore.loginURL"
            block
            color="primary"
            :disabled="!orgStore.canLogin"
            :href="orgStore.loginURL"
            prepend-icon="mdi-login"
            :text="$t('organization.loginTo', { ...orgStore.organisation })"
          />
          <v-alert
            v-if="!orgStore.canLogin"
            class="my-3"
            :text="$t('organization.cantLogin')"
            type="error"
          />
          <EditableHelpText
            :modelValue="orgStore.organisation.help_info"
            class="mt-3"
          />
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
            :items="tabs"
            v-model="currentTab"
            align-tabs="end"
            class="mb-4"
          />
          <v-window v-model="currentTab">
            <v-window-item value="default">
              <v-alert
                v-if="tabs && requiresCheck"
                :title="$t('home.contactInfo.requiresCheck')"
                :text="$t('home.contactInfo.requiresCheckDescription')"
                type="warning"
                class="mb-4"
              >
                <template #append>
                  <v-btn
                    :text="$t('home.contactInfo.check')"
                    @click="currentTab = 'contactInfo'"
                  />
                </template>
              </v-alert>
              <template v-if="editing">
                <Headline
                  v-model="changeForm.page_title"
                  editing
                  @submit="save"
                />
                <RichtextEditor
                  v-model="changeForm.body"
                  variant="full"
                  @keydown.ctrl.enter="save"
                />
                <div class="text-right">
                  <v-btn
                    :text="$t('cancel')"
                    variant="text"
                    @click="cancelEdit"
                  />
                  <v-btn
                    color="primary"
                    :disabled="!formChanged"
                    :text="$t('save')"
                    @click="save"
                  />
                </div>
              </template>
              <template v-else>
                <header class="d-flex">
                  <h1 class="flex-grow-1">
                    {{ orgStore.organisation.page_title }}
                  </h1>
                  <DropdownMenu :items="menu" />
                </header>
                <Richtext
                  :value="orgStore.organisation.body"
                  :maxHeight="collapsedBodyHeightMobile"
                />
              </template>
            </v-window-item>

            <template v-if="orgStore.canChangeOrganisation">
              <v-window-item value="roles">
                <UserSearch class="mb-6" @submit="addUser" />
                <RoleMatrix
                  admin
                  :contentType="organisationType"
                  :pk="orgStore.organisation.pk"
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
          <div v-if="inviteStore.matchedInvites.length" class="mb-4">
            <h2 class="mb-2">
              {{ $t('join.invites', inviteStore.matchedInvites.length) }}
            </h2>
            <Invite
              v-for="inv in inviteStore.matchedInvites"
              :key="inv.pk"
              :invite="inv"
              class="mb-4"
            />
          </div>
          <h2 class="mb-3">
            {{ $t('home.yourMeetings', meetingCount) }}
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
                class="meeting-item"
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
                v-if="expandable && !groupsExpanded"
                block
                :text="$t('organization.showMore')"
                variant="text"
                @click="groupsExpanded = true"
              />
            </v-list>
          </div>
          <p v-if="!meetingGroups.length" class="mb-4">
            <em>{{ $t('home.noCurrentMeetings') }}</em>
          </p>
          <DefaultDialog
            v-if="orgStore.canAddMeeting"
            :title="$t('meeting.create')"
          >
            <template #activator="{ props }">
              <v-btn
                block
                color="primary"
                prepend-icon="mdi-plus"
                :text="$t('meeting.create')"
                variant="text"
                v-bind="props"
              />
            </template>
            <template v-slot="{ close }">
              <AddMeeting @close="close" />
            </template>
          </DefaultDialog>
          <FindMeetingDialog v-if="meetingStore.hasHiddenMeetings" />
          <EditableHelpText
            :modelValue="orgStore.organisation.help_info"
            :editable="!!orgStore.canChangeOrganisation"
            :handler="(help_info) => orgStore.updateOrganisation({ help_info })"
            :placeholder="$t('home.helpInfoPlaceholder')"
            class="mt-3"
          />
        </v-col>
      </v-row>
      <v-row v-else-if="orgStore.organisationIsUnavailable">
        <v-col v-bind="cols">
          <v-sheet class="py-8 px-4 text-center" :border="true" rounded>
            <h1 class="mb-4 flex-grow-1">
              {{ $t('home.noOrganisationTitle') }}
            </h1>
            <p class="mb-12">
              {{ $t('home.noOrganisationDescription') }}
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

<style scoped lang="sass">
.meeting-item
  :deep(.v-list-item-title)
    white-space: normal
</style>
