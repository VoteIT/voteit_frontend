<template>
  <div class="home">
    <h1>Tillgängliga möten</h1>
    <ul v-if="orderedMeetings.length">
      <li v-for="meeting in orderedMeetings" :key="meeting.pk">
        <router-link :to="`/m/${meeting.pk}/${$slugify(meeting.title)}`">{{ meeting.title }}</router-link>
      </li>
    </ul>
    <input type="text" v-model="schemaName" />
    <button @click="getSchemaTest">Get schema</button>
    <div v-if="schema">
      <h2>{{ schema.title }}</h2>
      <ul>
        <li v-for="key in Object.keys(schema.properties)" :key="key">
          {{ key }}: {{ schema.properties[key].type }}{{ schema.required.includes(key) ? '*' : '' }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
// @ is an alias to /src

export default {
  name: 'Home',
  data () {
    return {
      schemaName: 'schema.get',
      schema: null
    }
  },
  computed: {
    ...mapGetters('meetings', ['orderedMeetings'])
  },
  methods: {
    getSchemaTest () {
      this.$objects.schema(this.schemaName)
        .then(({ p }) => {
          this.schema = p.message_schema
        })
        .catch(err => {
          this.schema = null
          alert(err)
        })
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
