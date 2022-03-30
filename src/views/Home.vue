<template>
  <v-row v-if="organisation" class="home mt-4 mb-4">
    <v-col v-if="!isAuthenticated" cols="12" order-sm="1" sm="4" xl="3">
      <v-btn block v-if="organisation.login_url" color="primary" :href="idLoginURL" prepend-icon="mdi-login">
        {{ t('organization.loginTo', organisation) }}
      </v-btn>
    </v-col>
    <v-col cols="12" order-md="0" md="8" lg="6" offset-lg="1" xl="5" offset-xl="2">
      <Tabs :tabs="tabs" v-model="currentTab">
        <template #default>
          <header class="d-flex">
            <div class="flex-grow-1">
              <h1>
                {{ organisation.title }}
              </h1>
            </div>
            <Menu :items="menu" />
          </header>
          <Richtext v-model="changeForm.body" :editing="editing" @edit-done="save()" variant="full" :maxHeight="collapsedBodyHeightMobile" />
        </template>
        <template #roles>
          <UserSearch class="mb-6" @submit="addUser" />
          <RoleMatrix admin :contentType="organisationType" :pk="organisation.pk" :icons="organisationIcons" />
        </template>
      </Tabs>
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
      <div v-if="canAddMeeting()" class="mb-4">
        <v-btn prepend-icon="mdi-plus" variant="text" color="primary" @click="createMeeting()">{{ t('meeting.create') }}</v-btn>
      </div>
      <h2>
        {{ t('join.joinAMeeting', otherMeetings.length) }}
      </h2>
      <v-list v-if="otherMeetings.length" class="mb-4">
        <v-list-item v-for="meeting in otherMeetings" :key="meeting.pk" :to="`/join/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t(`workflowState.${meeting.state}`)" />
      </v-list>
      <p v-if="!otherMeetings.length"><em>
        {{ t('home.noCurrentMeetings') }}
      </em></p>
    </v-col>
  </v-row>
  <v-row v-if="debug">
    <v-col class="text-center">
      <counter class="mt-12 mb-1" />
      <get-schema/>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTitle } from '@vueuse/core'

import { slugify } from '@/utils'

import AddMeetingVue from '@/modules/meetings/AddMeetingModal.vue'
import Counter from '@/components/examples/Counter.vue'
import GetSchema from '@/components/examples/GetSchema.vue'
// import Headline from '@/components/Headline.vue'
import Menu from '@/components/Menu.vue'
import Richtext from '@/components/Richtext.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import { Tab } from '@/components/types'
import Tabs from '@/components/Tabs.vue'
import UserSearch from '@/components/UserSearch.vue'

import useAuthentication from '@/composables/useAuthentication'
import useLoader from '@/composables/useLoader'
import useMeetings from '@/modules/meetings/useMeetings'
import useMeetingInvites from '@/modules/meetings/useMeetingInvites'
import useModal from '@/composables/useModal'
import useOrganisations from '@/modules/organisations/useOrganisations'
import Invite from '@/modules/meetings/Invite.vue'
import { canAddMeeting } from '@/modules/meetings/rules'
import { MenuItem } from '@/utils/types'
import { organisationType } from '@/modules/organisations/contentTypes'
import useOrganisation from '@/modules/organisations/useOrganisation'
import useDefaults from '@/composables/useDefaults'
import { OrganisationRole } from '@/modules/organisations/types'
import { ContextRoles } from '@/composables/types'
import useChannel from '@/composables/useChannel'

const { userMeetingInvites, clearInvites, fetchInvites } = useMeetingInvites()

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const { logout, isAuthenticated, user } = useAuthentication()
    const { fetchOrganisations } = useOrganisations()
    const { canChangeOrganisation, idLoginURL, organisation, organisationId } = useOrganisation()
    const loader = useLoader('Home')

    const currentTab = ref('default')
    const subscribeOrganisationId = computed(() => {
      if (currentTab.value !== 'roles') return
      return organisationId.value
    })
    useChannel('organisation', subscribeOrganisationId, { leaveOnUnmount: true })

    useTitle(computed(() => organisation.value ? `${organisation.value.title} | VoteIT` : 'VoteIT'))

    watch(isAuthenticated, value => {
      if (value) {
        fetchMeetings()
        fetchInvites()
      } else {
        clearMeetings()
        clearInvites()
      }
    })

    onBeforeMount(() => {
      if (isAuthenticated.value) loader.call(fetchMeetings, fetchInvites)
      // App.vue loads organisation data at first load
      if (loader.initDone.value) fetchOrganisations()
    })

    const participatingMeetings = computed(() => orderedMeetings.value.filter(m => m.current_user_roles))
    const otherMeetings = computed(() => orderedMeetings.value.filter(m => !m.current_user_roles))

    const editing = ref(false)
    const changeForm = reactive({
      // title: organisation.value?.title ?? '',
      body: organisation.value?.body ?? ''
    })
    watch(organisation, org => {
      // changeForm.title = org?.title ?? ''
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
    const tabs = computed<Tab[] | undefined>(() => {
      if (!canChangeOrganisation.value) return
      return [
        {
          name: 'default',
          title: 'Hem'
        },
        {
          name: 'roles',
          title: 'Roller'
        }
      ]
    })

    async function save () {
      if (!organisation.value) throw new Error('No organisation')
      await organisationType.api.patch(organisation.value.pk, changeForm)
      editing.value = false
    }

    // Add meeting
    const { openModal } = useModal()
    function createMeeting () {
      openModal({
        title: t('meeting.create'),
        component: AddMeetingVue
      })
    }

    function addUser (user: ContextRoles) {
      if (!organisation.value) return
      organisationType.addRoles(organisation.value.pk, user.pk, OrganisationRole.MeetingCreator)
    }

    return {
      t,
      changeForm,
      currentTab,
      debug: false,
      editing,
      idLoginURL,
      isAuthenticated,
      userMeetingInvites,
      menu,
      otherMeetings,
      organisation,
      organisationIcons,
      organisationType,
      participatingMeetings,
      tabs,
      user,

      addUser,
      canAddMeeting,
      createMeeting,
      logout,
      save,
      slugify,
      ...useDefaults()
    }
  },
  components: {
    Counter,
    GetSchema,
    // Headline,
    Invite,
    Menu,
    Richtext,
    RoleMatrix,
    Tabs,
    UserSearch
  }
})
</script>
