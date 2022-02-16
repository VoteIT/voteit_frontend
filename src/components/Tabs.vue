<template>
  <div class="tab-content">
    <v-item-group v-if="tabs" class="btn-controls mb-4" v-model="activeTab" mandatory>
      <v-item v-for="tab in tabs" :key="tab.name" :value="tab.name" v-slot="{ isSelected, toggle }">
        <v-btn :color="color" :variant="isSelected ? 'contained' : 'outlined'" @click="toggle()">{{ tab.title }}</v-btn>
      </v-item>
    </v-item-group>
    <slot :name="activeTab" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'

import { ThemeColor } from '@/utils/types'

import { Tab } from './types'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: String,
    tabs: Array as PropType<Tab[]>,
    color: {
      type: String as PropType<ThemeColor>,
      default: 'accent'
    }
  },
  setup (props, { emit }) {
    const activeTab = ref(props.modelValue || (props.tabs && props.tabs[0].name) || 'default')
    watch(activeTab, value => {
      emit('update:modelValue', value)
    })

    return {
      activeTab
    }
  }
})
</script>
