<script
  lang="ts"
  setup
  generic="T extends StateContent, CT extends ContentType<T, any, any>"
>
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { Color } from '@/utils/types'
import { StateContent } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'
import useErrorHandler from '@/composables/useErrorHandler'

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
const { handled } = useErrorHandler({ target: 'dialog' })
const eventsAvailable = computed(() =>
  props.contentType.sm.getAvailableEvents(props.object, t).map((t) => ({
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

const working = shallowRef(false)

async function sendEvent(event: Event) {
  working.value = true
  await handled(
    () => props.contentType.sm.sendEvent(props.object, event, t),
    'transition'
  )
  working.value = false
}
</script>

<template>
  <v-menu
    v-if="currentState && isUserModifiable"
    :location="right ? 'bottom end' : 'bottom start'"
  >
    <template #activator="{ props }">
      <v-btn
        append-icon="mdi-chevron-down"
        :color="currentState.color || color"
        :disabled="working"
        :prepend-icon="currentState.icon"
        size="x-small"
        :text="currentState.translate($t)"
        variant="flat"
        v-bind="{ ...$attrs, ...props }"
        @click.stop.prevent
        @mousedown.stop
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
  <v-chip
    v-else-if="currentState"
    :color="currentState.color || color"
    :prepend-icon="currentState.icon"
    size="x-small"
    :text="currentState.translate($t)"
    variant="flat"
  />
  <v-chip
    v-else
    :color="color"
    prepend-icon="mdi-help"
    size="x-small"
    :text="`Unknown state: ${props.object.state}`"
  />
</template>
