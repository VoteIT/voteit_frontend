<template>
  <form ref="formElem" class="schema-form" @submit.prevent="submit()">
    <div v-for="{ component, ...bind } in fields" :key="bind.name">
      <component :is="component" v-bind="bind" />
    </div>
    <div class="buttons" v-if="buttons">
      <v-btn v-for="btn in buttons" :key="btn.name" :prepend-icon="btn.icon">
        {{ btn.label }}
      </v-btn>
    </div>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, reactive, ref, watch } from 'vue'

import components from '.'
import { InputComponent, InputType, SchemaButton, SchemaInput } from './types'

export default defineComponent({
  emits: ['update:modelValue', 'update:valid'],
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
    const values = reactive(props.modelValue || {})
    watch(values, value => {
      emit('update:modelValue', value)
      checkValid()
    })

    const formElem = ref<HTMLFormElement | null>(null)
    function checkValid () {
      emit('update:valid', formElem.value?.checkValidity())
    }

    function getName (name: string) {
      if (props.name) return `${props.name}-${name}`
      return name
    }
    function getComponent (type: InputType): InputComponent {
      const component = components[type]
      if ('component' in component) return component.component
      return component
    }
    function getSettings (type: InputType, settings?: object): object {
      const component = components[type]
      return { ...(component.defaults || {}), ...(settings || {}) }
    }

    const fields = computed(() => {
      return props.schema.map(({ type, name, settings, ...rest }) => {
        return {
          component: getComponent(type),
          modelValue: values[name],
          name: getName(name),
          'onUpdate:modelValue': (val: unknown) => { values[name] = val },
          settings: getSettings(type, settings),
          ...rest
        }
      })
    })

    onMounted(checkValid)

    return {
      fields,
      formElem
    }
  }
})
</script>
