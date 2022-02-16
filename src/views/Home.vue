<template>
  <v-row v-if="organisation" class="home mt-4 mb-4">
    <v-col v-if="!isAuthenticated && organisation" cols="12" :order-sm="1" sm="4" xl="3">
      <v-btn block v-if="organisation.login_url" color="primary" :href="idLoginURL" prepend-icon="mdi-login">
        {{ t('organization.loginTo', organisation) }}
      </v-btn>
    </v-col>
    <v-col cols="12" order-sm="0" sm="8" lg="6" offset-lg="1" xl="5" offset-xl="2">
      <header class="d-flex">
        <div class="flex-grow-1">
          <Headline v-model="changeForm.title" :editing="editing" @submit="save()" />
          <Richtext v-model="changeForm.body" :editing="editing" @submit="save()" variant="full" />
        </div>
        <Menu :items="menu" />
      </header>
    </v-col>
    <v-divider vertical />
    <v-col v-if="isAuthenticated" cols="12" sm="4" xl="3">
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
import Invite from '@/modules/meetings/Invite.vue'
import { canAddMeeting } from '@/modules/meetings/rules'
import { MenuItem } from '@/utils/types'
import { canChangeOrganisation } from '@/modules/organisations/rules'
import { organisationType } from '@/modules/organisations/contentTypes'
import useOrganisation from '@/modules/organisations/useOrganisation'

const { userMeetingInvites, clearInvites, fetchInvites } = useMeetingInvites()

export default defineComponent({
  name: 'Home',
  setup () {
    const { t } = useI18n()
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const { logout, isAuthenticated, user } = useAuthentication()
    const { organisation } = useOrganisations()
    const { idLoginURL } = useOrganisation()
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
      debug: false,
      editing,
      idLoginURL,
      isAuthenticated,
      userMeetingInvites,
      menu,
      otherMeetings,
      organisation,
      participatingMeetings,
      user,

      canAddMeeting,
      createMeeting,
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
