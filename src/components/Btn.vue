<template>
  <v-btn :color="cColor" :size="sm ? 'small' : 'default'">
    <v-icon :left="!!$slots.default" v-if="icon" :icon="icon" />
    <span v-if="$slots.default"><slot/></span>
  </v-btn>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'Icon button',
  props: {
    icon: String,
    sm: Boolean,
    active: Boolean,
    color: {
      type: String,
      default: 'primary'
    }
  },
  setup (props) {
    if (props.icon && !props.icon.startsWith('mdi')) {
      console.error(`Icon ${props.icon} is not MDI`)
    }
    return {
      cColor: computed(() => props.active ? 'accent' : props.color)
    }
  }
})
</script>

<style lang="sass">
.btn-controls
  display: flex
  align-items: flex-end
  > .v-btn
    margin-right: .2rem
    &:last-child
      margin-right: 0

.btn-group
  .v-btn:not(:first-child)
    border-top-left-radius: 0
    border-bottom-left-radius: 0
  .v-btn:not(:last-child)
    border-top-right-radius: 0
    border-bottom-right-radius: 0
</style>
