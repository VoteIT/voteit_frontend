<template>
  <div>
    <v-overlay :modelValue="!!results.length" location-strategy="connected" location="bottom" scroll-strategy="close" :scrim="false" :transition="false" @click:outside="clickOutside()">
      <template #activator="{ props }">
        <v-form v-bind="props" class="user-search d-flex" :class="{ instant }" @submit.prevent="submit()">
          <v-text-field v-bind="fieldBind" :hint="hint" type="search" ref="inputField" autocomplete="off" v-model="query" hide-details class="hide-details" />
          <v-btn v-if="!instant" type="submit" v-bind="btnProps" color="primary" class="rounded-s-0">
            {{ buttonText || t('add') }}
          </v-btn>
        </v-form>
      </template>
      <v-list elevation="4" rounded>
        <v-list-item v-for="result in results" :key="result.pk" @click="select(result)" @keydown.enter="select(result)">
          <template #prepend>
            <UserAvatar :user="result" />
          </template>
          <template v-if="result.full_name">
            <v-list-item-title >{{ result.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ result.userid }}</v-list-item-subtitle>
          </template>
          <v-list-item-title v-else>-- unknown --</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-overlay>
  </div>
</template>

<script lang="ts" setup>
import { ComponentPublicInstance, computed, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { userType } from '@/modules/organisations/contentTypes'
import type { User } from '@/modules/organisations/types'

const TYPE_DELAY = 250 // delay in ms
let typeTimeout: number

const props = defineProps({
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
})
const emit = defineEmits(['submit'])

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

const btnProps = computed(() => ({
  prependIcon: props.small ? undefined : props.buttonIcon,
  disabled: !selected.value
}))

function clickOutside () {
  query.value = ''
}
</script>

<style lang="sass">
.user-search
  max-width: 480px
  &:not(.instant) .v-field__control
    border-top-right-radius: 0
  .v-btn
    height: auto !important
</style>
