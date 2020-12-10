<template>
  <div>
    <input type="text" v-model="schemaName" />
    <button @click="getOutgoingSchema">Get outgoing schema</button>
    <button @click="getIncomingSchema">Get incoming schema</button>
    <div v-if="schema" class="schema-result">
      <h2>{{ schema.title }}</h2>
      <p>{{ schema.description }}</p>
      <ul>
        <li v-for="key in Object.keys(schema.properties)" :key="key">
          {{ key }}: {{ schema.properties[key].type }}{{ schema.required && schema.required.includes(key) ? '*' : '' }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'GetSchema',
  data () {
    return {
      schemaName: 'schema.get_outgoing',
      schema: null
    }
  },
  methods: {
    getOutgoingSchema () {
      this.$channels.outgoing_schema(this.schemaName)
        .then(({ p }) => {
          this.schema = p.message_schema
        })
        .catch(_ => {
          this.schema = null
        })
    },
    getIncomingSchema () {
      this.$channels.incoming_schema(this.schemaName)
        .then(({ p }) => {
          this.schema = p.message_schema
        })
        .catch(_ => {
          this.schema = null
        })
    }
  }
}
</script>

<style lang="sass">
.schema-result
  background-color: #eee
  padding: 10px 30px
  margin-top: 20px
  text-align: left
  position: relative
  border-radius: 10px
  &::after
    content: ""
    position: absolute
    top: -30px
    left: 50%
    transform: translateX(-50%)
    border: 15px solid transparent
    border-bottom: 15px solid #eee
</style>
