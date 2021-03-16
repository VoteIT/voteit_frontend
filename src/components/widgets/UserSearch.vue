<template>
  <span class="user-search">
    <input type="search" :class="{ selected: !!selected }" name="search" autocomplete="off" v-model="query" @keyup="delayedSearch" />
    <Btn type="submit" :icon="buttonIcon" :disabled="!selected" @click="$emit('submit', selected)">{{ buttonText }}</Btn>
    <v-sheet rounded elevation="4" class="selector" v-show="results.length">
      <v-btn block plain v-for="result in results" :key="result.pk" @click="select(result)">
        <span v-if="result.full_name">{{ result.full_name }}</span>
        <em v-else>-- unknown --</em>
      </v-btn>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import userType from '@/contentTypes/user'
import { User } from '@/utils/types'
import { defineComponent, ref } from 'vue'

const TYPE_DELAY = 250 // delay in ms
let typeTimeout: number

export default defineComponent({
  name: 'SearchUser',
  props: {
    buttonIcon: {
      type: String,
      default: 'mdi-plus'
    },
    buttonText: {
      type: String,
      default: 'Add'
    }
  },
  emits: ['submit'],
  setup () {
    const contentApi = userType.getContentApi()
    const query = ref('')
    const results = ref<User[]>([])
    const selected = ref<User | null>(null)

    function search () {
      if (query.value) {
        contentApi.list({ search: query.value })
          .then(({ data }: { data: User[] }) => {
            results.value = data
          })
      } else {
        results.value = []
      }
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

    return {
      selected,
      select,
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
  .selector
    position: absolute
    top: 38px
    left: 2px
    background-color: var(--alt-bg)
    min-width: 210px
    z-index: 100
</style>
