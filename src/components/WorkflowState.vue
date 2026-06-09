<script
  lang="ts"
  setup
  generic="T extends StateContent, CT extends ContentType<T, any, any>"
>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Color } from '@/utils/types'
import { StateContent } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'

type Event = CT extends ContentType<any, infer E, any> ? E : never

const props = withDefaults(
  defineProps<{
    admin?: boolean
    color?: Color
    contentType: CT
    object: T
    right?: boolean
  }>(),
  {
    admin: false,
    color: 'secondary'
  }
)

const { t } = useI18n()
const eventsAvailable = computed(() =>
  props.contentType.sm.getAvailableEvents(props.object).map((t) => ({
    ...t,
    unmetConditions: t.reason
  }))
)

const currentState = computed(() =>
  props.contentType.sm.getState(props.object.state)
)
const isUserModifiable = computed<boolean>(
  () => props.admin && !currentState.value?.final
)

const working = ref(false)

async function sendEvent(event: Event) {
  working.value = true
  await props.contentType.sm.sendEvent(props.object, event, t)
  working.value = false
}

// function unmetConditions(t: ITransition<Transition>) {
//   if (t.allowed) return
//   return t.conditions
//     .filter((c) => !c.allowed)
//     .map((c) => c.title)
//     .join(', ')
// }
</script>

<template>
  <v-menu
    v-if="currentState && isUserModifiable"
    :location="right ? 'bottom end' : 'bottom start'"
  >
    <template #activator="{ props }">
      <v-btn
        append-icon="mdi-chevron-down"
        class="text-no-wrap"
        :color="currentState.color || color"
        :disabled="working"
        :prepend-icon="currentState.icon"
        size="x-small"
        :text="currentState.translate($t)"
        variant="flat"
        v-bind="{ ...$attrs, ...props }"
      />
    </template>
    <v-list density="comfortable">
      <v-list-item
        v-for="t in eventsAvailable"
        :key="t.name"
        :disabled="t.disabled"
        link
        :prepend-icon="t.icon"
        :subtitle="t.reason"
        :title="t.name"
        @click="sendEvent(t.id)"
      />
    </v-list>
  </v-menu>
  <v-btn
    v-else-if="currentState"
    class="text-no-wrap"
    :color="currentState.color || color"
    disabled
    :prepend-icon="currentState.icon"
    size="x-small"
    :text="currentState.translate($t)"
    variant="flat"
  />
  <v-btn
    v-else
    class="text-no-wrap"
    :color="color"
    disabled
    prepend-icon="mdi-help"
    size="x-small"
    :text="`Unknown state: ${props.object.state}`"
    variant="flat"
  />
</template>
