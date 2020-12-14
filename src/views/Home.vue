<template>
  <main class="home" v-if="isAuthenticated">
    <p>Logged in as {{ user.username }} <button @click="logout">Logout</button></p>
    <h1>Available meetings</h1>
    <ul v-if="orderedMeetings.length">
      <li v-for="meeting in orderedMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
    <counter/>
    <get-schema/>
  </main>
  <main class="home" v-else>
    <h1>Pick a user</h1>
    <ul>
      <li v-for="user in users" :key="user.username">
        <button @click="authenticate(user.username)">
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
            <input type="checkbox" id="is_super" v-model="newUser.is_superuser" /> <label for="is_super">Superuser <icon sm name="verified_user"/></label>
          </p>
          <p class="error" v-show="newUserError">Username not accepted</p>
          <input type="text" required v-model="newUser.username" /><input type="submit" value="Create">
        </form>
      </li>
    </ul>
  </main>
</template>

<script>
// import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import Counter from '@/components/examples/Counter'
import getSchema from '@/components/examples/GetSchema'

import useMeetings from '@/composables/useMeetings.js'
import useRestApi from '@/composables/useRestApi.js'
import useAuthentication from '@/composables/useAuthentication.js'
import useLoader from '@/composables/useLoader.js'

export default {
  name: 'Home',
  setup () {
    const { orderedMeetings, fetchMeetings } = useMeetings()
    const { restApi } = useRestApi()
    return {
      orderedMeetings,
      fetchMeetings,
      restApi,
      ...useAuthentication(),
      ...useLoader()
    }
  },
  data () {
    return {
      users: [],
      addUser: false,
      newUser: {
        username: '',
        is_superuser: false
      },
      newUserError: false
    }
  },
  components: {
    Counter,
    getSchema
  },
  methods: {
    createUser () {
      this.newUserError = false
      this.restApi.post('dev-login/', this.newUser)
        .then(() => {
          this.users.push(this.newUser)
        })
        .catch(() => {
          this.newUserError = true
        })
    }
  },
  created () {
    this.fetch(this.fetchMeetings)
    this.restApi.get('dev-login/')
      .then(({ data }) => {
        this.users = data
      })
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
