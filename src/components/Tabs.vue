<template>
  <v-item-group class="btn-controls mb-4" v-model="activeTab">
    <v-item v-for="tab in tabs" :key="tab.name" :value="tab.name" v-slot="{ isSelected, toggle }">
      <v-btn color="accent" :variant="isSelected ? 'contained' : 'outlined'" @click="toggle()">{{ tab.title }}</v-btn>
    </v-item>
  </v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'

import { Tab } from './types'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: String,
      required: true
    },
    tabs: {
      type: Array as PropType<Tab[]>,
      required: true
    }
  },
  setup (props, { emit }) {
    const activeTab = ref(props.modelValue)
    watch(activeTab, value => {
      emit('update:modelValue', value)
    })

    return {
      activeTab
    }
  }
})
</script>
