<template>
  <span class="voteit-tag" :class="{ disabled }" :style="style" data-denotation-char="#" :data-value="name" @click="tagClickEvent.emit(name)">
    <v-icon size="x-small" icon="mdi-tag-outline" />
    #{{ name }}
    <v-icon v-if="closer" size="x-small" icon="mdi-close" @click.stop="$emit('remove')" />
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import stringToHSL from '@/utils/stringToHSL'
import { tagClickEvent } from '@/modules/meetings/useTags'

export default defineComponent({
  emits: ['remove'],
  props: {
    name: {
      type: String,
      required: true
    },
    disabled: Boolean,
    closer: Boolean
  },
  setup (props) {
    return {
      style: computed(() => ({
        'background-color': stringToHSL(props.name)
      })),
      tagClickEvent
    }
  }
})
</script>

<style lang="sass" scoped>
.voteit-tag
  white-space: nowrap
  padding: .2em .6em
  border-radius: 4px
  color: #000
  font-size: 10pt

span[data-denotation-char="#"]:not(.disabled)
  user-select: unset
  cursor: pointer

.mdi-close
  position: relative
  top: -2px
  left: 5px
</style>
