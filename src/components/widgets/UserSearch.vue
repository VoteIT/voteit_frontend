<template>
  <span class="user-search">
    <input type="search" :placeholder="t('searchUser')" :class="{ selected: !!selected }" name="search" autocomplete="off" v-model="query" @keyup="delayedSearch" />
    <v-btn :prepend-icon="buttonIcon" color="primary" :disabled="!selected" @click="submit()">
      {{ buttonText || t('add') }}
    </v-btn>
    <v-sheet rounded elevation="4" class="selector" v-show="results.length">
      <v-btn block plain v-for="result in results" :key="result.pk" @click="select(result)">
        <span v-if="result.full_name">{{ result.full_name }} ({{ result.userid }})</span>
        <em v-else>-- unknown --</em>
      </v-btn>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import { User } from '@/contentTypes/types'
import userType from '@/contentTypes/user'
import { defineComponent, PropType, ref } from 'vue'

const TYPE_DELAY = 250 // delay in ms
let typeTimeout: number

export default defineComponent({
  name: 'SearchUser',
  inject: ['t'],
  props: {
    buttonIcon: {
      type: String,
      default: 'mdi-plus'
    },
    buttonText: String,
    omitIds: Array as PropType<number[]>
  },
  emits: ['submit'],
  setup (props, { emit }) {
    const contentApi = userType.getContentApi()
    const query = ref('')
    const results = ref<User[]>([])
    const selected = ref<User | null>(null)

    async function search () {
      if (!query.value) {
        results.value = []
        return
      }
      const { data } = await contentApi.list({
        search: query.value
      })
      results.value = data.filter(u => !props.omitIds?.includes(u.pk))
    }

    function select (user: User) {
      selected.value = user
      results.value = []
      query.value = user.full_name
    }

    function delayedSearch () {
      selected.value = null
      clearTimeout(typeTimeout)
      typeTimeout = setTimeout(() => {
        search()
      }, TYPE_DELAY)
    }

    function submit () {
      emit('submit', selected.value)
      selected.value = null
      query.value = ''
    }

    return {
      selected,
      select,
      submit,
      results,
      query,
      delayedSearch
    }
  }
})
</script>

<style lang="sass">
.user-search
  display: flex
  position: relative
  input[type=search]
    padding: 0 .4em
    background-color: rgb(var(--v-theme-surface))
    border-bottom: 1px transparent
    outline: none
    &:focus
      border-bottom: 1px solid rgb(var(--v-theme-on-surface))
  .selector
    position: absolute
    top: 38px
    left: 2px
    background-color: rgb(var(--v-theme-surface))
    min-width: 210px
    z-index: 100
  .v-btn
    border-top-left-radius: 0
    border-bottom-left-radius: 0
</style>
