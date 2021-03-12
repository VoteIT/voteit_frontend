<template>
  <v-main class="home" v-if="isAuthenticated">
    <div>
      {{ t('auth.loggedInAs', user) }}
      <btn @click="logout">{{ t('auth.logout') }}</btn>
    </div>
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
      <btn icon="plus" @click="startNewMeeting()">{{ t('meeting.new') }}</btn>
    </div>
    <template v-if="debug">
      <counter :style="{ marginTop: '1.5em' }" />
      <get-schema/>
    </template>
  </v-main>
  <v-main class="home" v-else>
    <h1>Pick a user</h1>
    <ul>
      <li v-for="user in users" :key="user.username">
        <Btn @click="authenticate(user)" :icon="user.is_superuser ? 'verified_user' : 'face'">
          {{ user.username }}
        </Btn>
      </li>
      <li>
        <Btn icon="plus" @click="addUser = !addUser">
          New user
        </Btn>
        <form v-show="addUser" @submit.prevent="createUser">
          <p>
            <input type="checkbox" id="is_super" v-model="newUser.is_superuser" />
            <label for="is_super">Superuser <Icon sm>verified_user</Icon></label>
          </p>
          <p class="error" v-show="newUserError">Username not accepted</p>
          <input type="text" required v-model="newUser.username" /><input class="btn" type="submit" value="Create">
        </form>
      </li>
    </ul>
  </v-main>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onBeforeMount, reactive, ref, watch } from 'vue'

import { slugify } from '@/utils'

import AddMeetingVue from '@/components/modals/AddMeeting.vue'
import Counter from '@/components/examples/Counter.vue'
import getSchema from '@/components/examples/GetSchema.vue'

import devLogin from '@/contentTypes/devLogin'
import rules from '@/contentTypes/meeting/rules'
import useAuthentication from '@/composables/useAuthentication'
import useLoader from '@/composables/useLoader'
import useMeetings from '@/composables/useMeetings'
import useModal from '@/composables/useModal'
import { NewDevUser, DevUser } from '@/utils/types'

export default defineComponent({
  name: 'Home',
  inject: ['debug'],
  setup () {
    const { orderedMeetings, fetchMeetings, clearMeetings } = useMeetings()
    const devApi = devLogin.getContentApi()
    const { authenticate, logout, isAuthenticated, user } = useAuthentication()
    const users = ref<DevUser[]>([])
    const loader = useLoader('Home')
    const t: CallableFunction = inject('t') as CallableFunction

    watch(isAuthenticated, value => {
      if (value) {
        fetchMeetings()
      } else {
        clearMeetings()
      }
    })

    onBeforeMount(() => {
      loader.call(async () => {
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
    const newUser = reactive<NewDevUser>({
      username: '',
      is_superuser: false
    })
    const newUserError = ref(false)

    function createUser () {
      newUserError.value = false
      devApi.add(newUser)
        .then(() => {
          users.value.push({ ...newUser } as DevUser)
        })
        .catch(() => {
          newUserError.value = true
        })
        .finally(() => {
          newUser.username = ''
          newUser.is_superuser = false
        })
    }

    const participatingMeetings = computed(() => {
      return orderedMeetings.value.filter(m => m.current_user_roles)
    })

    const otherMeetings = computed(() => {
      return orderedMeetings.value.filter(m => !m.current_user_roles)
    })

    // Add meeting
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

      ...rules,
      startNewMeeting,
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
main.home
  text-align: center
  ul
    padding: 0
    margin-bottom: 3em
  li
    list-style: none
    padding: 4px
</style>
