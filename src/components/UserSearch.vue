<template>
  <span class="user-search">
    <v-text-field type="search" prepend-inner-icon="mdi-account" :class="{ selected: !!selected }" autocomplete="off" :label="computedLabel" v-model="query" @focus="deSelect()" />
    <v-btn :prepend-icon="buttonIcon" color="primary" :disabled="!selected" @click="submit()">
      {{ buttonText || t('add') }}
    </v-btn>
    <v-sheet rounded elevation="4" class="selector" v-show="results.length">
      <v-list>
        <v-list-item v-for="result in results" :key="result.pk" @click="select(result)">
          <div v-if="result.full_name">
            <v-list-item-title >{{ result.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ result.userid }}</v-list-item-subtitle>
          </div>
          <v-list-item-title v-else>-- unknown --</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import { userType } from '@/modules/organisations/contentTypes'
import { User } from '@/modules/organisations/types'
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const TYPE_DELAY = 250 // delay in ms
let typeTimeout: number

export default defineComponent({
  name: 'SearchUser',
  props: {
    buttonIcon: {
      type: String,
      default: 'mdi-plus'
    },
    buttonText: String,
    omitIds: Array as PropType<number[]>,
    label: String
  },
  emits: ['submit'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const query = ref('')
    const results = ref<User[]>([])
    const selected = ref<User | null>(null)
    const computedLabel = computed(() => props.label ?? t('searchUser'))

    async function search () {
      if (!query.value) {
        results.value = []
        return
      }
      const { data } = await userType.api.list({
        search: query.value
      })
      results.value = data.filter(u => !props.omitIds?.includes(u.pk))
    }

    function select (user: User) {
      selected.value = user
      results.value = []
      query.value = user.full_name
    }

    watch(query, () => {
      if (selected.value) return // Never search when selected
      clearTimeout(typeTimeout)
      typeTimeout = setTimeout(() => {
        search()
      }, TYPE_DELAY)
    })

    function deSelect () {
      query.value = ''
      selected.value = null
    }

    function submit () {
      emit('submit', selected.value)
      selected.value = null
      query.value = ''
    }

    return {
      t,
      computedLabel,
      selected,
      results,
      query,
      select,
      deSelect,
      submit
    }
  }
})
</script>

<style lang="sass">
.user-search
  display: flex
  position: relative
  max-width: 480px
  .v-input
    margin: 0
  .selector
    position: absolute
    top: 56px
    left: 2px
    background-color: rgb(var(--v-theme-surface))
    min-width: 210px
    z-index: 100
  .v-btn
    height: auto !important
    border-top-left-radius: 0
    border-bottom-left-radius: 0
</style>
