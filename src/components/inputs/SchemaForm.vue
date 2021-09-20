<template>
  <form class="schema-form" @submit.prevent="submit()">
    <div v-for="input in schema" :key="input.name">
      <component :is="getComponent(input)" :name="getName(input)" :label="input.label" :settings="getSettings(input)" v-model="value[input.name]" />
    </div>
    <div class="buttons" v-if="buttons">
      <v-btn v-for="btn in buttons" :key="btn.name" :prepend-icon="btn.icon">
        {{ btn.label }}
      </v-btn>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'
import components from '.'
import { InputComponent, SchemaButton, SchemaInput } from './types'

export default defineComponent({
  props: {
    name: String,
    schema: {
      type: Array as PropType<SchemaInput[]>,
      required: true
    },
    settings: Object,
    buttons: Object as PropType<SchemaButton[]>,
    modelValue: Object
  },
  setup (props, { emit }) {
    const value = reactive(props.modelValue || {})
    watch(value, value => {
      emit('update:modelValue', value)
    })

    function getName (input: SchemaInput) {
      if (props.name) return `${props.name}-${input.name}`
      return input.name
    }
    function getComponent (input: SchemaInput): InputComponent {
      const component = components[input.type]
      if ('component' in component) return component.component
      return component
    }
    function getSettings (input: SchemaInput): object {
      const component = components[input.type]
      return { ...(component.defaults || {}), ...(input.settings || {}) }
    }

    return {
      getName,
      getComponent,
      getSettings,
      value
    }
  }
})
</script>

<style lang="sass">
form
  > div
    margin-bottom: 1em
  label
    font-weight: bold
    font-size: 10pt
    display: block
    &.inline
      display: inline
  select,
  input[type=text],
  input[type=number]
    min-height: 2em
    padding: 0 .4em
    border-bottom: rgb(var(--v-border-color))
    background-color: rgb(var(--v-theme-surface))
    &:focus
      border-bottom: 1px solid rgb(var(--v-theme-on-background))
      outline: none
  select,
  input[type=text]
    width: 100%
  input[type=checkbox]
    margin-right: .4em
</style>
