<template>
  <teleport v-if="mounted" to="#toolbar">
    <v-toolbar
      color="secondary-lighten-2"
      elevation="1"
      class="text-black"
      :title="title"
    >
      <v-defaults-provider :defaults="{ VBtn: { variant: 'tonal' } }">
        <slot></slot>
      </v-defaults-provider>
      <template v-if="$slots.extension" #extension>
        <v-defaults-provider :defaults="{ VBtn: { variant: 'tonal' } }">
          <slot name="extension"></slot>
        </v-defaults-provider>
      </template>
    </v-toolbar>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ref } from 'vue'

interface Props {
  title?: string
}

defineProps<Props>()

// This is a workaround to solve an issue with teleport,
// where parent components have not rendered, and
// #toolbar element is not present.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
</script>
