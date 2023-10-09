<template>
  <v-menu
    v-if="currentState && isUserModifiable"
    :location="right ? 'bottom end' : 'bottom start'"
    @update:model-value="menuOpenChange"
  >
    <template #activator="{ props }">
      <v-btn
        :disabled="working"
        :prepend-icon="currentState.icon"
        append-icon="mdi-chevron-down"
        class="text-no-wrap"
        size="x-small"
        variant="flat"
        v-bind="props"
        :color="currentState.color || color"
      >
        {{ currentState.getName(t) }}
      </v-btn>
    </template>
    <v-list density="comfortable">
      <div v-if="fetching" class="text-center">
        <v-progress-circular indeterminate />
      </div>
      <v-list-item
        v-else
        v-for="t in transitionsAvailable"
        :key="t.name"
        :prepend-icon="t.icon"
        :title="t.title"
        :disabled="!t.allowed"
        :subtitle="unmetConditions(t)"
        @click="makeTransition(t)"
        link
      />
    </v-list>
  </v-menu>
  <v-btn
    v-else-if="currentState"
    :prepend-icon="currentState.icon"
    class="text-no-wrap"
    disabled
    size="x-small"
    variant="flat"
    :color="currentState.color || color"
  >
    {{ currentState.getName(t) }}
  </v-btn>
  <v-btn
    v-else
    class="text-no-wrap"
    disabled
    prepend-icon="mdi-help"
    size="x-small"
    variant="flat"
    :color="color"
  >
    {{ `Unknown state: ${props.object.state}` }}
  </v-btn>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Color } from '@/utils/types'
import useAlert from '@/composables/useAlert'
import { StateContent, Transition } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'

interface Props {
  admin?: boolean
  color?: Color
  object: StateContent
  contentType: ContentType<any>
  right?: boolean
}
const props = withDefaults(defineProps<Props>(), { admin: false, color: 'secondary' })

const { t } = useI18n()
const contentApi = props.contentType.getContentApi()
const { getState } = props.contentType.useWorkflows()
const transitionsAvailable = ref<Transition[] | null>(null)
const { alert } = useAlert()

const currentState = computed(() => getState(props.object.state))
const isUserModifiable = computed<boolean>(() => props.admin && !currentState.value?.isFinal)

const fetching = ref(false)
async function menuOpenChange (open: boolean) {
  if (!open || fetching.value) return
  fetching.value = true
  try {
    transitionsAvailable.value = await contentApi.getTransitions(props.object.pk)
  } catch {
    alert('^Could not get available transitions')
  }
  fetching.value = false
}

const working = ref(false)
async function makeTransition (t: Transition) {
  working.value = true
  try {
    await contentApi.transition(props.object.pk, t.name)
  } catch {}
  working.value = false
}

function unmetConditions (t: Transition) {
  if (t.allowed) return
  return t.conditions
    .filter(c => !c.allowed)
    .map(c => c.title)
    .join(', ')
}

watch(() => props.object, () => {
  transitionsAvailable.value = null
})
</script>
