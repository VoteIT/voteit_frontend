<template>
  <div>
    <input type="text" v-model="schemaName" />
    <button @click="getSchemaTest">Get schema</button>
    <div v-if="schema">
      <h2>{{ schema.title }}</h2>
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
      schemaName: 'schema.get',
      schema: null
    }
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
    }
  }
}
</script>
