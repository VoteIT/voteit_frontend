<template>
  <v-select :label="label" :items="items" v-model="value" />
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
    })

    return {
      items,
      value
    }
  }
}) as InputComponent
</script>
