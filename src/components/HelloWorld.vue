<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <ul class="ai">
      <li v-for="ai in ongoing" :key="ai.pk">{{ ai.title }}</li>
    </ul>
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa" target="_blank" rel="noopener">pwa</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-router" target="_blank" rel="noopener">router</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-vuex" target="_blank" rel="noopener">vuex</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
    </ul>
    <h3>Essential Links</h3>
    <ul>
      <li><a href="https://vuejs.org" target="_blank" rel="noopener">Core Docs</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a></li>
      <li><a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a></li>
      <li><a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a></li>
    </ul>
    <h3>Ecosystem</h3>
    <ul>
      <li><a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a></li>
      <li><a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a></li>
      <li><a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">vue-devtools</a></li>
      <li><a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a></li>
    </ul>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data () {
    return {
      id: 1 // Get from $route, probably
    }
  },
  methods: {
    aiType (type) {
      return this.agenda.filter(ai => ai.state === type)
    },
    ...mapMutations(['updateAgenda'])
  },
  computed: {
    ongoing () {
      return this.aiType('ongoing')
    },
    ...mapState(['agenda'])
  },
  created () {
    this.$subscribeObject(`agenda/${this.id}`, this.updateAgenda)
    this.$api.get(`meetings/${this.id}`)
      .then(data => {
        console.log('loaded meeting', data)
      })
      .catch(err => {
        console.log('failed loading meeting', err)
      })
  },
  beforeUnmount () {
    this.$leaveObject(`agenda/${this.id}`, this.updateAgenda)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="sass">
h3
  margin: 40px 0 0
ul:not(.ai)
  list-style-type: none
  padding: 0

  li
    display: inline-block
    margin: 0 10px
a
  color: #42b983
</style>
