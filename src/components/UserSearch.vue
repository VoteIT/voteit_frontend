<template>
  <form class="user-search" @submit.prevent="submit()">
    <v-text-field :hint="hint" type="search" ref="inputField" v-bind="fieldBind" autocomplete="off" v-model="query" />
    <v-btn v-if="!instant" type="submit" v-bind="btnBind" color="primary">
      {{ buttonText || t('add') }}
    </v-btn>
    <v-sheet rounded elevation="4" class="selector" v-show="results.length">
      <v-list>
        <v-list-item v-for="result in results" :key="result.pk" @click="select(result)" @keydown.enter="select(result)">
          <div v-if="result.full_name">
            <v-list-item-title >{{ result.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ result.userid }}</v-list-item-subtitle>
          </div>
          <v-list-item-title v-else>-- unknown --</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-sheet>
  </form>
</template>

<script lang="ts">
import { userType } from '@/modules/organisations/contentTypes'
import { User } from '@/modules/organisations/types'
import { ComponentPublicInstance, computed, defineComponent, PropType, ref, watch } from 'vue'
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
    params: {
      type: Object,
      default: () => ({})
    },
    filter: Function as PropType<(user: User) => boolean>,
    label: String,
    hint: String,
    small: Boolean,
    instant: Boolean
  },
  emits: ['submit'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const query = ref('')
    const results = ref<User[]>([])
    const selected = ref<User | null>(null)

    async function search () {
      if (!query.value) {
        results.value = []
        return
      }
      const { data } = await userType.api.list({
        ...props.params,
        search: query.value
      })
      if (props.filter) results.value = data.filter(props.filter)
      else results.value = data
    }

    function select (user: User) {
      selected.value = user
      results.value = []
      query.value = user.full_name
      if (props.instant) submit()
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

    const fieldBind = computed(() => ({
      prependInnerIcon: props.small ? undefined : 'mdi-account',
      label: props.label ?? t('searchUser'),
      class: { selected: !!selected.value },
      onFocus: deSelect
    }))

    const inputField = ref<ComponentPublicInstance | null>(null)
    function submit () {
      emit('submit', selected.value)
      deSelect()
      if (props.instant) inputField.value?.$el.focus()
    }

    const btnBind = computed(() => ({
      prependIcon: props.small ? undefined : props.buttonIcon,
      disabled: !selected.value
    }))

    return {
      t,
      btnBind,
      fieldBind,
      inputField,
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
  .v-input__details
    display: none
  .v-field__control
    border-top-right-radius: 0
  // .v-input
  //   margin: 0
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
