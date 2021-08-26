<template>
  <div class="voteit-switch" @click="toggle()" :class="{ loading, active, disabled }">
    <div class="lever"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  props: {
    value: Boolean,
    modelValue: Boolean,
    loading: Boolean,
    disabled: Boolean,
    readonly: Boolean
  },
  setup (props, { emit }) {
    const active = ref(props.modelValue)

    function toggle () {
      if (props.disabled) return
      emit('change', !active.value)
      if (!props.readonly) emit('update:modelValue', !active.value)
    }

    watch(() => props.modelValue, value => {
      active.value = value
    })

    return {
      active,
      toggle
    }
  }
})
</script>

<style lang="sass">
.voteit-switch
  display: inline-block
  margin: 4px
  height: 16px
  width: 40px
  background-color: rgba(var(--v-theme-secondary), .8)
  transition: background-color .2s
  border-radius: 8px
  &.active
    background-color: rgb(var(--v-theme-primary), .8)

  .lever
    background-color: rgba(var(--v-theme-secondary), 1)
    border-radius: 15px
    position: relative
    width: 24px
    height: 24px
    left: -4px
    top: -4px
    transition: left .4s, background-color .2s

  &.active .lever
    background-color: rgba(var(--v-theme-primary), 1)
    left: 20px

  &.loading .lever
    left: 8px

  &.disabled
    opacity: .6
</style>
