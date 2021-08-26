<template>
  <div class="help-text" :class="color">
    <v-icon :icon="computedIcon" size="small" />
    <p><slot/></p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

type HelpThemeColor = 'default' | 'success' | 'warning'
const colorMapping: Record<HelpThemeColor, string> = {
  default: 'mdi-lightbulb',
  success: 'mdi-check',
  warning: 'mdi-exclamation'
}

export default defineComponent({
  props: {
    color: {
      type: String as PropType<HelpThemeColor>,
      default: 'default'
    },
    icon: String
  },
  setup (props) {
    const computedIcon = computed(() => props.icon || colorMapping[props.color])
    return {
      computedIcon
    }
  }
})
</script>

<style lang="sass">
.help-text
  display: flex
  align-items: flex-start
  background-color: rgb(var(--v-theme-info-lighten-2))
  color: rgba(var(--v-theme-on-background), .7)
  .mdi
    margin: .5em
  p
    font-weight: 500
    margin: .5em
    flex: 1 1 auto
    white-space: pre-line

  &.success
    background-color: rgb(var(--v-theme-success-lighten-2))
    color: rgb(var(--v-theme-on-success-lighten-2))
  &.warning
    background-color: rgb(var(--v-theme-warning))
    color: rgb(var(--v-theme-on-warning))
</style>
