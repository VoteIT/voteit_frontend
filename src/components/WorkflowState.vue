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
      <WorkflowTransition
        v-else
        v-for="t in transitionsAvailable"
        :key="t.name"
        :content-type="contentType"
        :obj="obj"
        :transition="t.name"
        v-slot="{ props }"
      >
        <v-list-item
          v-bind="props"
          :prepend-icon="t.icon"
          :title="t.title"
          :disabled="!t.allowed"
          :subtitle="unmetConditions(t)"
          link
        />
      </WorkflowTransition>
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

<script
  lang="ts"
  setup
  generic="T extends StateContent, Transition extends string"
>
import { computed, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Color } from '@/utils/types'
import useAlert from '@/composables/useAlert'
import { StateContent, Transition as ITransition } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'
import WorkflowTransition from './WorkflowTransition.vue'

const props = withDefaults(
  defineProps<{
    admin?: boolean
    color?: Color
    object: T
    contentType: ContentType<T, Transition, any>
    right?: boolean
  }>(),
  {
    admin: false,
    color: 'secondary'
  }
)

const obj = computed(() => props.object) // Vue TS generics workaround. Don't know why it needs to be like this.
const { t } = useI18n()
const { getState } = props.contentType.useWorkflows()
const transitionsAvailable: Ref<ITransition<Transition>[] | null> = ref(null)
const { alert } = useAlert()

const currentState = computed(() => getState(props.object.state))
const isUserModifiable = computed<boolean>(
  () => props.admin && !currentState.value?.isFinal
)

const fetching = ref(false)
async function menuOpenChange(open: boolean) {
  if (!open || fetching.value) return
  fetching.value = true
  try {
    transitionsAvailable.value = await props.contentType.transitions.get(
      props.object.pk
    )
  } catch {
    alert('^Could not get available transitions')
  }
  fetching.value = false
}

const working = ref(false)

function unmetConditions(t: ITransition<Transition>) {
  if (t.allowed) return
  return t.conditions
    .filter((c) => !c.allowed)
    .map((c) => c.title)
    .join(', ')
}

watch(
  () => props.object,
  () => {
    transitionsAvailable.value = null
  }
)
</script>
