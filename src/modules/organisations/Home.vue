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
        {{ t('home.yourMeetings', participatingMeetings.length) }}
      </h2>
      <v-list v-if="participatingMeetings.length" class="mb-4">
        <v-list-item v-for="meeting in participatingMeetings" :key="meeting.pk" :to="`/m/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t(`workflowState.${meeting.state}`)" />
      </v-list>
      <p v-else class="mb-4"><em>{{ t('home.noCurrentMeetings') }}</em></p>
      <v-dialog v-if="canAddMeeting">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            block
            class="mb-4"
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
      <div v-if="otherMeetings.length">
        <h2>
          {{ t('join.joinAMeeting', otherMeetings.length) }}
        </h2>
        <v-list v-if="otherMeetings.length" class="mb-4">
          <v-list-item v-for="meeting in otherMeetings" :key="meeting.pk" :to="`/join/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t(`workflowState.${meeting.state}`)" />
        </v-list>
        <p v-if="!otherMeetings.length"><em>
          {{ t('home.noCurrentMeetings') }}
        </em></p>
      </div>
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
const { orderedMeetings } = useMeetings(loader.call)

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

const participatingMeetings = computed(() => orderedMeetings.value.filter(m => m.current_user_roles))
const otherMeetings = computed(() => orderedMeetings.value.filter(m => !m.current_user_roles))

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
  if (!organisation.value) return
  organisationType.addRoles(organisation.value.pk, user.pk, OrganisationRole.MeetingCreator)
}

const { dialogDefaults, collapsedBodyHeightMobile } = useDefaults()
</script>
