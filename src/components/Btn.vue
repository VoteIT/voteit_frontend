<template>
  <v-btn :color="cColor" :size="sm ? 'small' : 'default'">
    <v-icon :left="!!$slots.default" v-if="icon" :icon="mdIcon" />
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
    return {
      mdIcon: computed(() => props.icon && (props.icon.startsWith('mdi-') ? props.icon : 'mdi-' + props.icon.replaceAll('_', '-'))),
      cColor: computed(() => props.active ? 'accent' : props.color)
    }
  }
})
</script>

<style lang="sass">
.material-icons.sm
  font-size: 1.2rem

.btn
  border: none
  background-color: var(--btn-bg)
  color: var(--btn-text)
  transition: background .3s
  cursor: pointer
  padding: .2rem .6rem
  border-radius: 6px
  .material-icons
    color: var(--discrete-icon)
    vertical-align: middle
  &:hover
    background: var(--btn-hover-bg)
  &.active
    background: var(--btn-active-bg)
    color: var(--btn-active-text)
    &:hover
      background: var(--btn-active-hover-bg)
  &.btn-sm
    border: 0
    padding: 4px 6px
    .material-icons
      font-size: 1.2rem
  span
    margin: 0 .2em

  &:disabled
    opacity: .5

.btn-controls
  > .v-btn
    margin-right: .2rem
    &:last-child
      margin-right: 0
</style>
