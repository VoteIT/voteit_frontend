<template>
  <div>
    <online-status/>
    <router-view/>
  </div>
</template>

<script>
import OnlineStatus from '@/components/OnlineStatus'
import { mapActions } from 'vuex'

export default {
  components: {
    OnlineStatus
  },
  methods: {
    ...mapActions(['authenticate'])
  },
  created () {
    // For dev purposes. Should be called on login.
    this.authenticate()
  }
}
</script>

<style lang="sass">
$material-icons-font-path: '~material-icons/iconfont/'
@import '~material-icons/iconfont/material-icons.scss'

*
  box-sizing: border-box

body
  margin: 0

#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  color: #2c3e50

#offline
  margin: -10px -10px 10px
  background-color: #000
  color: #fff

#nav
  padding: 30px

  a
    font-weight: bold
    color: #2c3e50

    &.router-link-exact-active
      color: #42b983
</style>
