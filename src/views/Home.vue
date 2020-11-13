<template>
  <div class="home">
    <h1>Tillgängliga möten</h1>
    <ul v-if="orderedMeetings.length">
      <li v-for="meeting in orderedMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
    <button @click="getSchemaTest('schema.get')">Schema get</button>
    <button @click="getSchemaTest('fail.test')">Schema fail</button>
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
    getSchemaTest (type) {
      this.$objects.schema(type)
        .then(({ p }) => console.log(p))
        .catch(err => alert(JSON.stringify(err)))
    },
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
