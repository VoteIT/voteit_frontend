<template>
  <div>
    <v-form v-bind="props" class="user-search d-flex" :class="{ instant }" @submit.prevent="submit()">
      <v-autocomplete
        clearable
        hide-details
        hide-no-data
        item-title="full_name"
        item-value="pk"
        ref="inputField"
        v-model="selected"
        v-model:search="query"
        :label="label"
        :items="results"
      >
        <template #item="{ item, props }">
          <v-list-item
            link
            :subtitle="item.raw.userid"
            :title="item.raw.full_name"
            v-bind="props"
          >
            <template #prepend>
              <UserAvatar :user="item.raw" />
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
      <v-btn v-if="!instant" type="submit" v-bind="btnProps" color="primary" class="rounded-s-0">
        {{ buttonText || t('add') }}
      </v-btn>
    </v-form>
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
  filter: Function as PropType<(user: User) => boolean>,
  instant: Boolean,
  label: String,
  params: {
    type: Object,
    default: () => ({})
  }
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

watch(query, () => {
  if (selected.value) return // Never search when selected
  clearTimeout(typeTimeout)
  typeTimeout = setTimeout(() => {
    search()
  }, TYPE_DELAY)
})

function deSelect () {
  selected.value = null
  query.value = ''
}

const inputField = ref<ComponentPublicInstance | null>(null)
function submit () {
  if (!selected.value) return
  emit('submit', selected.value)
  deSelect()
  if (props.instant) inputField.value?.$el.focus()
}

const btnProps = computed(() => ({
  prependIcon: props.buttonIcon,
  disabled: !selected.value
}))

if (props.instant) {
  watch(selected, submit)
}
</script>

<style lang="sass" scoped>
.user-search
  max-width: 480px
  &:not(.instant) :deep(.v-field)
    border-top-right-radius: 0
  .v-btn
    height: auto !important
</style>
