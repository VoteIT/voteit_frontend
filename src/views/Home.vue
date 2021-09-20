<template>
  <v-row class="home" v-if="isAuthenticated">
    <v-col class="text-center">
      <h1>{{ t('home.yourMeetings', participatingMeetings.length) }}</h1>
      <ul v-if="participatingMeetings.length">
        <li v-for="meeting in participatingMeetings" :key="meeting.pk">
          <RouterLink :to="`/m/${meeting.pk}/${slugify(meeting.title)}`">{{ meeting.title }}</RouterLink>
        </li>
      </ul>
      <p v-else><em>{{ t('home.noCurrentMeetings') }}</em></p>
      <template v-if="otherMeetings.length">
        <h1>{{ t('join.joinAMeeting', otherMeetings.length) }}</h1>
        <ul>
          <li v-for="meeting in otherMeetings" :key="meeting.pk">
            <RouterLink :to="`/join/${meeting.pk}/${slugify(meeting.title)}`">{{ meeting.title }}</RouterLink>
          </li>
        </ul>
      </template>
      <div v-if="canAdd()">
        <btn icon="mdi-plus" @click="createMeeting()">{{ t('meeting.create') }}</btn>
      </div>
      <template v-if="debug">
        <counter :style="{ marginTop: '1.5em' }" />
        <get-schema/>
      </template>
    </v-col>
  </v-row>
  <template v-else>
    <v-row class="home">
      <v-col>
        <h1>{{ t('organizations') }}</h1>
      </v-col>
    </v-row>
    <v-row class="organizations">
      <v-col cols="4" v-for="o in organisations.values()" :key="o.pk">
        <v-card :title="o.title" v-if="o.login_url">
          <v-card-text>
            <h3 class="text-h6 mb-2">{{ t('organization.requires') }}</h3>
            <v-chip-group>
              <v-chip v-for="scope in o.scopes" :key="scope">{{ scope }}</v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions v-if="o.login_url">
            <v-btn :href="getOrganizationLoginURL(o)" prepend-icon="mdi-login">
              {{ t('organization.loginTo', o) }}
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card :title="o.title" :subtitle="t('organization.noLogin')" v-else/>
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import AddMeetingVue from '@/components/modals/AddMeeting.vue'
import Counter from '@/components/examples/Counter.vue'
import getSchema from '@/components/examples/GetSchema.vue'

import rules from '@/contentTypes/meeting/rules'
import useAuthentication from '@/composables/useAuthentication'
import useLoader from '@/composables/useLoader'
import useMeetings from '@/composables/useMeetings'
import useModal from '@/composables/useModal'
import useOrganisations from '@/modules/organisations/composables/useOrganisations'
import useOrganisation from '@/modules/organisations/composables/useOrganisation'
import { useTitle } from '@vueuse/core'

export default defineComponent({
  name: 'Home',
  inject: ['debug'],
  setup () {
    const { t } = useI18n()
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const { logout, isAuthenticated, user, getOrganizationLoginURL } = useAuthentication()
    const { fetchOrganisations, organisations } = useOrganisations()
    const { organisation } = useOrganisation()
    const loader = useLoader('Home')

    useTitle(computed(() => organisation.value ? `${organisation.value.title} | VoteIT` : 'VoteIT'))

    watch(isAuthenticated, value => {
      if (value) fetchMeetings()
      else clearMeetings()
    })

    onBeforeMount(() => {
      fetchOrganisations()
      if (isAuthenticated.value) loader.call(fetchMeetings)
    })

    const participatingMeetings = computed(() => {
      return orderedMeetings.value.filter(m => m.current_user_roles)
    })

    const otherMeetings = computed(() => {
      return orderedMeetings.value.filter(m => !m.current_user_roles)
    })

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
      participatingMeetings,
      otherMeetings,
      organisations,
      isAuthenticated,
      user,
      ...rules,

      createMeeting,
      getOrganizationLoginURL,
      logout,
      slugify
    }
  },
  components: {
    Counter,
    getSchema
  }
})
</script>

<style lang="sass">
div.home
  ul
    padding: 0
    margin-bottom: 3em
  li
    list-style: none
    padding: 4px
  .organizations
    .v-sheet
      padding: .5em 1em
      background-color: rgb(var(--v-theme-surface))
</style>
