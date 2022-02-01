<template>
  <div>
    <input type="text" v-model="schemaName" />
    <v-btn color="primary" @click="getSchema(SchemaType.Outgoing)">Get outgoing schema</v-btn>
    <v-btn color="primary" @click="getSchema()">Get incoming schema</v-btn>
    <div v-if="schema" class="schema-result">
      <h2>{{ schema.title }}</h2>
      <p>{{ schema.description }}</p>
      <ul>
        <li v-for="[key, property] in Object.entries(schema.properties)" :key="key">
          {{ key }}: {{ property.type }}{{ schema.required?.includes(key) ? '*' : '' }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import Channel from '@/contentTypes/Channel'
import { SchemaType } from '@/contentTypes/types'

export default defineComponent({
  name: 'GetSchema',
  setup () {
    const channels = new Channel('testing')

    const schemaName = ref('schema.get_outgoing')
    const schema = ref<Object | null>(null)

    async function getSchema (type: SchemaType) {
      try {
        const { p } = await channels.getSchema(schemaName.value, type)
        schema.value = p.message_schema
      } catch {
        schema.value = null
      }
    }

    return {
      getSchema,
      schema,
      schemaName,
      SchemaType
    }
  }
})
</script>

<style lang="sass">
.schema-result
  background-color: rgb(var(--v-theme-surface))
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
    border-bottom: 15px solid rgb(var(--v-theme-surface))
</style>
