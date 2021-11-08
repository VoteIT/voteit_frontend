<template>
  <v-field active model-value="value" class="mb-9">
    <v-field-label v-if="label" :for="name" floating>
      {{ label }}
    </v-field-label>
    <select :id="name" :required="required" v-model="value" class="v-field__input">
      <option disabled v-if="required" :value="undefined">{{ t('select') }}</option>
      <option v-else :value="undefined">---</option>
      <option v-for="[value, name] in Object.entries(options)" :key="value" :value="value">{{ name }}</option>
    </select>
  </v-field>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    required: Boolean,
    modelValue: String,
    options: {
      type: Object as PropType<Record<string, string>>,
      required: true
    },
    label: String,
    name: String
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const value = ref(props.modelValue)
    watch(value, value => {
      emit('update:modelValue', value)
    })
    return {
      t,
      value
    }
  }
})
</script>
