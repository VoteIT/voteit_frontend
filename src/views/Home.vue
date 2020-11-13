<template>
  <div class="home">
    <h1>Tillgängliga möten</h1>
    <ul v-if="orderedMeetings.length">
      <li v-for="meeting in orderedMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
// @ is an alias to /src

export default {
  name: 'Home',
  computed: {
    ...mapGetters('meetings', ['orderedMeetings'])
  },
  methods: {
    ...mapMutations('meetings', ['setMeetings'])
  },
  created () {
    this.$api.get('meetings/')
      .then(({ data }) => {
        this.setMeetings(data)
      })
      .catch(alert)
  }
}
</script>
