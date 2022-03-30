<template>
  <v-select :label="label" :items="items" v-model="value" />
  <!-- <v-field active model-value="value" :label="label">
    <select :id="name" :required="required" v-model="value" class="v-field__input">
      <option v-if="!required" :value="undefined">---</option>
      <option v-for="[value, name] in Object.entries(options)" :key="value" :value="value">{{ name }}</option>
    </select>
  </v-field> -->
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { InputComponent } from './types'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    label: String,
    modelValue: String,
    name: String,
    settings: Object,
    options: {
      type: Object as PropType<Record<string, string>>,
      required: true
    },
    required: Boolean,
    toNumber: Boolean
  },
  setup (props, { emit }) {
    // TODO: Change this to { value, text } objects when Vuetify supports it fully.
    if (!props.options) throw new Error('Select requires :options="Record<string, string>"')
    const value = ref(props.modelValue && props.options[props.modelValue])

    // TODO: Remove this when Vuetify works with { value, text }.
    const realValue = computed(() => {
      if (!props.options) throw new Error('Select requires :options="Record<string, string>"')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return Object.entries(props.options).find(([v, text]) => text === value.value)?.[0]
    })

    watch(realValue, value => {
      if (props.toNumber && value !== undefined) return emit('update:modelValue', Number(value))
      emit('update:modelValue', value)
    })

    const items = computed(() => {
      if (!props.options) throw new Error('Select requires :options="Record<string, string>"')
      return Object.values(props.options)
      // const list = Object.entries(props.options)
      //   .map(([value, text]) => ({ value, text }))
      // if (props.required) return list
      // return [{
      //   text: '---'
      // }, ...list]
    })

    return {
      items,
      value
    }
  }
}) as InputComponent
</script>
