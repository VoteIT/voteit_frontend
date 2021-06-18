<template>
  <span class="voteit-tag" :class="{ disabled }" :style="style" data-denotation-char="#" :data-value="name">
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
    },
    disabled: Boolean
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

<style lang="sass">
.voteit-tag
  white-space: nowrap
  padding: .2em .6em
  border-radius: 4px
  color: #000
  font-size: 10pt

span[data-denotation-char="#"]:not(.disabled)
  user-select: unset
  cursor: pointer
</style>
