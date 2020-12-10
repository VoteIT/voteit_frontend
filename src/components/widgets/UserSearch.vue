<template>
  <span class="user-search">
    <input type="search" :class="{ selected: !!selected }" name="search" autocomplete="off" v-model="text" @keyup="delayedSearch" />
    <button type="submit" :disabled="!selected" @click="$emit('submit', selected)"><icon sm :name="buttonIcon"/> {{ buttonText }}</button>
    <div class="selector" v-show="active">
      <ul>
        <li v-for="result in results" :key="result.pk" @click="select(result)">
          {{ result.full_name }}
        </li>
      </ul>
    </div>
  </span>
</template>

<script>
const TYPE_DELAY = 250 // delay in ms
let typeTimeout

export default {
  name: 'SearchUser',
  props: {
    buttonIcon: {
      type: String,
      default: 'add'
    },
    buttonText: {
      type: String,
      default: 'Add'
    }
  },
  data () {
    return {
      text: '',
      results: [],
      active: false,
      selected: null
    }
  },
  methods: {
    search () {
      this.$api.get('users/', { params: { search: this.text } })
        .then(({ data }) => {
          this.active = true
          this.results = data
        })
    },
    select (user) {
      this.selected = user
      this.text = user.username
      this.active = false
    },
    delayedSearch () {
      this.selected = null
      if (this.text.length === 0) {
        this.active = false
      }
      clearTimeout(typeTimeout)
      typeTimeout = setTimeout(_ => {
        this.search()
      }, TYPE_DELAY)
    }
  }
}
</script>
