<template>
  <main class="home" v-if="isAuthenticated">
    <p>
      {{ t('auth.loggedInAs', user) }}
      <btn @click="logout">{{ t('auth.logout') }}</btn>
    </p>
    <h1>{{ t('home.yourMeetings', participatingMeetings.length) }}</h1>
    <ul v-if="participatingMeetings.length">
      <li v-for="meeting in participatingMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
    <p v-else><em>{{ t('home.noCurrentMeetings') }}</em></p>
    <template v-if="otherMeetings.length">
      <h1>{{ t('join.joinAMeeting', otherMeetings.length) }}</h1>
      <ul>
        <li v-for="meeting in otherMeetings" :key="meeting.pk">
          <router-link :to="`/join/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
        </li>
      </ul>
    </template>
    <div v-if="hasPerm('add')">
      <btn icon="add" @click="startNewMeeting()">{{ t('meeting.new') }}</btn>
    </div>
    <template v-if="debug">
      <counter :style="{ marginTop: '1.5em' }" />
      <get-schema/>
    </template>
  </main>
  <main class="home" v-else>
    <h1>Pick a user</h1>
    <ul>
      <li v-for="user in users" :key="user.username">
        <button @click="authenticate(user)">
          <icon v-if="user.is_superuser" name="verified_user" sm />
          <icon v-else name="face" sm />
          {{ user.username }}
        </button>
      </li>
      <li>
        <button @click="addUser = !addUser">
          <icon name="add" sm />
          New user
        </button>
        <form v-show="addUser" @submit.prevent="createUser">
          <p>
            <input type="checkbox" id="is_super" v-model="newUser.is_superuser" />
            <label for="is_super">Superuser <icon sm name="verified_user"/></label>
          </p>
          <p class="error" v-show="newUserError">Username not accepted</p>
          <input type="text" required v-model="newUser.username" /><input type="submit" value="Create">
        </form>
      </li>
    </ul>
  </main>
</template>

<script>
import { computed, inject, onBeforeMount, ref, watch } from 'vue'

import Counter from '@/components/examples/Counter'
import getSchema from '@/components/examples/GetSchema'

import useAuthentication from '@/composables/useAuthentication.js'
import useContentApi from '@/composables/useContentApi.js'
import useLoader from '@/composables/useLoader.js'
import useMeetings from '@/composables/useMeetings.js'
import usePermissions from '@/rules/usePermissions'
import useModal from '@/composables/useModal'
import AddMeetingVue from '@/components/modals/AddMeeting.vue'

export default {
  name: 'Home',
  inject: ['debug'],
  setup () {
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const devApi = useContentApi('dev_login')
    const { authenticate, logout, isAuthenticated, user } = useAuthentication()
    const users = ref([])
    const loader = useLoader('Home')
    const t = inject('t')

    watch(isAuthenticated, value => {
      if (value) {
        fetchMeetings()
      } else {
        clearMeetings()
      }
    })

    onBeforeMount(_ => {
      loader.call(_ => {
        return devApi.list()
          .then(({ data }) => {
            users.value = data
          })
      })
      if (isAuthenticated.value) {
        loader.call(fetchMeetings)
      }
    })

    const addUser = ref(false)
    const newUser = ref({
      username: '',
      is_superuser: false
    })
    const newUserError = ref(false)

    function createUser () {
      newUserError.value = false
      devApi.add(newUser.value)
        .then(_ => {
          users.value.push(newUser.value)
        })
        .catch(_ => {
          newUserError.value = true
        })
    }

    const participatingMeetings = computed(_ => {
      return orderedMeetings.value.filter(m => m.current_user_roles)
    })

    const otherMeetings = computed(_ => {
      return orderedMeetings.value.filter(m => !m.current_user_roles)
    })

    // Add meeting
    const { hasPerm } = usePermissions('meeting.meeting')
    const { openModal } = useModal()

    function startNewMeeting () {
      openModal({
        title: t('meeting.new'),
        component: AddMeetingVue
      })
    }

    return {
      t,
      participatingMeetings,
      otherMeetings,
      authenticate,
      logout,
      isAuthenticated,
      user,
      users,

      addUser,
      newUser,
      newUserError,
      createUser,

      hasPerm,
      startNewMeeting
    }
  },
  components: {
    Counter,
    getSchema
  }
}
</script>

<style lang="sass">
main.home
  text-align: center
  ul
    padding: 0
    margin-bottom: 3em
  li
    list-style: none
    padding: 4px
</style>
