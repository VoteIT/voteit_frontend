<script lang="ts" setup>
import { ComponentPublicInstance, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import { userType } from '@/modules/organisations/contentTypes'
import type { User } from '@/modules/organisations/types'

const TYPE_DELAY = 250 // delay in ms
let typeTimeout: ReturnType<typeof setTimeout>

interface Props {
  buttonIcon?: string
  buttonText?: string
  filter?(user: User): boolean
  hint?: string
  instant?: boolean
  label?: string
  params?: object
}
const props = withDefaults(defineProps<Props>(), {
  buttonIcon: 'mdi-plus',
  params() {
    return {}
  }
})
const emit = defineEmits(['submit'])

type FullNameUser = User & { fullName: string }
function annotateFullName(user: User) {
  return {
    ...user,
    fullName: getFullName(user)
  }
}

const { t } = useI18n()
const query = ref('')
const results = ref<FullNameUser[]>([])
const selected = ref<User | null>(null)

async function search() {
  if (!query.value) {
    results.value = []
    return
  }
  const { data } = await userType.api.list({
    ...props.params,
    search: query.value
  })
  results.value = (props.filter ? data.filter(props.filter) : data).map(
    annotateFullName
  )
}

watch(query, () => {
  if (selected.value) return // Never search when selected
  clearTimeout(typeTimeout)
  typeTimeout = setTimeout(() => {
    search()
  }, TYPE_DELAY)
})

function deSelect() {
  selected.value = null
  query.value = ''
  results.value = []
}

const inputField = ref<ComponentPublicInstance | null>(null)
function submit() {
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

<template>
  <div>
    <v-form
      v-bind="props"
      class="user-search d-flex"
      :class="{ instant }"
      @submit.prevent="submit()"
    >
      <v-autocomplete
        clearable
        hide-details
        hide-no-data
        item-title="fullName"
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
            :subtitle="item.raw.userid || undefined"
            v-bind="props"
          >
            <template #prepend>
              <UserAvatar :user="item.raw" />
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
      <v-btn
        v-if="!instant"
        type="submit"
        v-bind="btnProps"
        color="primary"
        class="rounded-s-0"
      >
        {{ buttonText || t('add') }}
      </v-btn>
    </v-form>
    <slot name="hint"></slot>
  </div>
</template>

<style lang="sass" scoped>
.user-search
  max-width: 480px
  &:not(.instant) :deep(.v-field)
    border-top-right-radius: 0
  .v-btn
    height: auto !important
</style>
