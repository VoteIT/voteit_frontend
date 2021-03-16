<template>
  <v-icon :small="sm" :icon="name" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Material icon',
  props: {
    name: {
      type: String,
      required: true
    },
    sm: Boolean,
    active: Boolean
  },
  setup (props) {
    if (!props.name.startsWith('mdi-')) {
      console.error(`Icon ${props.name} is not MDI`)
    }
  }
})
</script>
