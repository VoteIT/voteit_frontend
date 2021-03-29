<template>
  <span class="tag" :style="style">
    <v-icon size="x-small" icon="mdi-tag-outline"/>
    #{{ name }}
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import stringToHSL from '@/utils/stringToHSL'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    }
  },
  setup (props) {
    return {
      style: computed(() => ({
        'background-color': stringToHSL(props.name)
      }))
    }
  }
})
</script>

<style lang="sass" scoped>
.tag
  white-space: nowrap
  padding: .2em .6em
  border-radius: 4px
  color: #000
  font-size: 10pt
  user-select: all
</style>
