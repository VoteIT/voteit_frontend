<template>
  <button class="btn" :class="{ 'btn-sm': sm, active }">
    <icon v-if="icon" :sm="sm" :name="icon" />
    <span><slot/></span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Icon button',
  props: {
    icon: String,
    sm: Boolean,
    active: Boolean
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
  .span
    margin-right: .3rem

  &:disabled
    opacity: .5

.btn-controls
  > .btn
    margin-right: .2rem
    &:last-child
      margin-right: 0
</style>
