<template>
  <button v-if="button" class="btn" :class="{ 'btn-sm': sm, active }">
    <i class="material-icons">{{ name }}</i> <slot/>
  </button>
  <i v-else-if="name" class="material-icons" :class="{ sm }">{{ name }}</i>
  <i v-else class="material-icons" :class="{ sm }"><slot/></i>
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
</style>
