<template>
  <div id="alerts">
    <div class="alert" :class="alert.level" v-for="(alert, id) in alerts" :key="id">
      <icon sm name="close" class="close" @click="dismiss(alert)" />
      <span v-if="alert.html" v-html="alert.html" />
      <span v-else>
        <strong v-if="alert.title">{{ alert.title }}:</strong>
        {{ alert.text }}
      </span>
    </div>
    <button class="dismiss-all" v-if="alerts.length > 1" @click="dismiss()"><icon sm name="clear_all" />Dismiss all</button>
  </div>
</template>

<script>
import { emitter } from '@/utils'

const AUTO_DISMISS_DELAY = 5000 // Auto dismiss in ms
const DEFAULTS = {
  sticky: false,
  level: 'info'
}

export default {
  name: 'Alerts',
  data () {
    return {
      alerts: []
    }
  },
  methods: {
    dismiss (alert) {
      if (alert) {
        this.alerts = this.alerts.filter(a => a !== alert)
      } else {
        this.alerts = []
      }
    },
    open (alert) {
      alert = Object.assign({}, DEFAULTS, alert)
      this.alerts.push(alert)
      if (!alert.sticky) {
        alert = this.alerts[this.alerts.length - 1]
        setTimeout(_ => this.dismiss(alert), AUTO_DISMISS_DELAY)
      }
    }
  },
  created () {
    emitter.on('alert-open', this.open)
  }
}
</script>

<style lang="sass">
#alerts
  position: fixed
  bottom: 1.5rem
  right: 1.5rem
  width: calc(100% - 3rem)
  max-width: 600px

  .alert
    margin-top: 1rem
    background-color: #ddd
    padding: 1rem
    border-radius: 5px
    box-shadow: 1px 1px 3px rgba(#000, .3)

    &.info
      background-color: #ddf
    &.error
      background-color: #e8d3d3
    &.warning
      background-color: #ffd

  .close
    float: right
    cursor: pointer
    position: relative
    top: -.4rem
    left: .4rem
    opacity: .5
    &:hover
      opacity: 1

  .dismiss-all
    float: right
    margin-top: 1rem
</style>
