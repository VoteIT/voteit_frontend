<template>
  <div class="widget">
    <slot/>
  </div>
</template>

<style lang="sass">
.widget
  margin-bottom: 1rem
  background-color: var(--widget-bg)
  border: var(--widget-border)
  border-radius: 6px
  padding: 10px
  h2
    margin-top: 0
  .btn-controls
    text-align: right
</style>
