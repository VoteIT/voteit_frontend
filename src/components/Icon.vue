<template>
  <button v-if="button" class="btn" :class="{ 'btn-sm': sm, active }">
    <i class="material-icons">{{ name }}</i> <slot/>
  </button>
  <i v-else class="material-icons" :class="{ sm }">{{ name }}</i>
</template>

<script>
export default {
  name: 'Material icon',
  props: {
    name: String,
    button: Boolean,
    sm: Boolean,
    active: Boolean
  }
}
</script>

<style lang="sass">
.material-icons.sm
  font-size: 1.2rem

.btn
  background-color: #ccc
  color: #333
  transition: background-color .3s
  cursor: pointer
  &:hover
    background-color: #aaa
  &.active
    background-color: #000
    color: #eee
    &:hover
      background-color: #333
  &.btn-sm
    border: 0
    border-radius: 6px
    padding: 4px 6px 2px
    .material-icons
      font-size: 1.2rem
</style>
