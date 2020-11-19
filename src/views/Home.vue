<template>
  <main class="home">
    <h1>Tillgängliga möten</h1>
    <ul v-if="orderedMeetings.length">
      <li v-for="meeting in orderedMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
    <counter/>
    <get-schema/>
  </main>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'
import Counter from '@/components/examples/Counter'
import getSchema from '@/components/examples/GetSchema'

export default {
  name: 'Home',
  components: {
    Counter,
    getSchema
  },
  computed: {
    ...mapGetters('meetings', ['orderedMeetings']),
    ...mapState(['isAuthenticated'])
  },
  methods: {
    initialize () {
      this.$api.get('meetings/')
        .then(({ data }) => {
          this.setMeetings(data)
        })
        .catch(alert)
    },
    logout () {
      this.setMeetings([])
    },
    ...mapMutations('meetings', ['setMeetings'])
  }
}
</script>

<style lang="sass">
main.home
  text-align: center
</style>
