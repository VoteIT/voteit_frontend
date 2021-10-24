<template>
  <v-row v-if="organisation" class="home mt-6 mb-4">
    <v-col sm="10" offset-sm="1" lg="8" offset-lg="2" xl="6" offset-xl="3">
      <Menu :items="menu" float />
      <Headline v-model="changeForm.title" :editing="editing" @submit="save()" />
      <Richtext v-model="changeForm.body" :editing="editing" @submit="save()" variant="full" />
    </v-col>
  </v-row>
  <v-row v-if="isAuthenticated">
    <v-col cols="12" sm="5" offset-sm="1" lg="4" offset-lg="2" xl="3" offset-xl="3">
      <h1>
        {{ t('home.yourMeetings', participatingMeetings.length) }}
      </h1>
      <v-list v-if="participatingMeetings.length">
        <v-list-item v-for="meeting in participatingMeetings" :key="meeting.pk" :to="`/m/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t(`workflowState.${meeting.state}`)" />
      </v-list>
      <p v-else><em>{{ t('home.noCurrentMeetings') }}</em></p>
      <div v-if="canAddMeeting()" class="mt-4">
        <v-btn prepend-icon="mdi-plus" variant="text" color="primary" @click="createMeeting()">{{ t('meeting.create') }}</v-btn>
      </div>
    </v-col>
    <v-col cols="12" sm="6" lg="4" xl="3">
      <h1>
        {{ t('join.joinAMeeting', otherMeetings.length) }}
      </h1>
      <v-list v-if="otherMeetings.length">
        <v-list-item v-for="meeting in otherMeetings" :key="meeting.pk" :to="`/join/${meeting.pk}/${slugify(meeting.title)}`" :title="meeting.title" :subtitle="t(`workflowState.${meeting.state}`)" />
      </v-list>
      <p v-else><em>{{ t('home.noCurrentMeetings') }}</em></p>
    </v-col>
    <v-col cols="12" lg="4" v-if="meetingInvites.length">
      <h1>
        {{ t('join.invites', meetingInvites.length) }}
      </h1>
      <Invite v-for="inv in meetingInvites" :key="inv.pk" :invite="inv" />
    </v-col>
  </v-row>
  <v-row v-else-if="organisation">
    <v-col sm="10" offset-sm="1" lg="8" offset-lg="2" xl="6" offset-xl="3">
      <v-card :title="t('login')" v-if="organisation.login_url" border class="mt-6">
        <v-card-text>
          <h3 class="text-h6 mb-2">{{ t('organization.requires') }}</h3>
          <div>
            <v-chip v-for="scope in organisation.scope" :key="scope">{{ scope }}</v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn variant="text" :href="manageAccountURL" prepend-icon="mdi-account">
            {{ t('auth.manageAccount') }}
          </v-btn>
          <v-btn color="primary" :href="getOrganizationLoginURL(organisation)" prepend-icon="mdi-login">
            {{ t('organization.loginTo', organisation) }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <p v-else><em>Login not available</em></p>
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

import { slugify } from '@/utils'

import AddMeetingVue from '@/modules/meetings/AddMeetingModal.vue'
import Richtext from '@/components/Richtext.vue'
import Headline from '@/components/Headline.vue'
import Menu from '@/components/Menu.vue'
import Counter from '@/components/examples/Counter.vue'
import getSchema from '@/components/examples/GetSchema.vue'

import useAuthentication from '@/composables/useAuthentication'
import useLoader from '@/composables/useLoader'
import useMeetings from '@/modules/meetings/useMeetings'
import useMeetingInvites from '@/modules/meetings/useMeetingInvites'
import useModal from '@/composables/useModal'
import useOrganisations from '@/modules/organisations/useOrganisations'
import { useTitle } from '@vueuse/core'
import Invite from '@/modules/meetings/Invite.vue'
import { canAddMeeting } from '@/modules/meetings/rules'
import { MenuItem } from '@/utils/types'
import { canChangeOrganisation } from '@/modules/organisations/rules'
import { organisationType } from '@/modules/organisations/contentTypes'

const { meetingInvites, clearInvites, fetchInvites } = useMeetingInvites()

export default defineComponent({
  name: 'Home',
  inject: ['debug'],
  setup () {
    const { t } = useI18n()
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const { logout, isAuthenticated, user, getOrganizationLoginURL, manageAccountURL } = useAuthentication()
    const { fetchOrganisations, organisation } = useOrganisations()
    const loader = useLoader('Home')

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
      fetchOrganisations()
      if (isAuthenticated.value) loader.call(fetchMeetings, fetchInvites)
    })

    const participatingMeetings = computed(() => orderedMeetings.value.filter(m => m.current_user_roles))
    const otherMeetings = computed(() => orderedMeetings.value.filter(m => !m.current_user_roles))

    const editing = ref(false)
    const changeForm = reactive({
      title: organisation.value?.title ?? '',
      body: organisation.value?.body ?? ''
    })
    watch(organisation, org => {
      changeForm.title = org?.title ?? ''
      changeForm.body = org?.body ?? ''
    })
    const menu = computed<MenuItem[]>(() => {
      if (!organisation.value || !canChangeOrganisation(organisation.value)) return []
      return [
        {
          title: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
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
    return {
      t,
      changeForm,
      editing,
      isAuthenticated,
      manageAccountURL,
      meetingInvites,
      menu,
      otherMeetings,
      organisation,
      participatingMeetings,
      user,

      canAddMeeting,
      createMeeting,
      getOrganizationLoginURL,
      logout,
      save,
      slugify
    }
  },
  components: {
    Counter,
    getSchema,
    Headline,
    Invite,
    Menu,
    Richtext
  }
})
</script>
