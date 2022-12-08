<template>
  <v-dialog v-model="isActive" v-bind="dialogDefaults" :persistent="persistent" :height="height">
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs" />
    </template>
    <template #default="attrs">
      <v-sheet class="pa-4" :color="color">
        <div v-if="title && !persistent" class="d-flex mb-4">
          <h2 v-if="title" class="flex-grow-1">
            {{ title }}
          </h2>
          <v-spacer v-else />
          <v-btn
            v-if="!persistent"
            class="mt-n2 mr-n2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="close"
          />
        </div>
        <slot v-bind="attrs" :close="close" />
      </v-sheet>
    </template>
  </v-dialog>
</template>

<script lang="ts" setup>
import { PropType, ref, watch } from 'vue'

import { Color } from '@/utils/types'
import useDefaults from '@/composables/useDefaults'

const { dialogDefaults } = useDefaults()

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  color: String as PropType<Color>,
  height: [String, Number],
  modelValue: Boolean,
  persistent: Boolean,
  title: String
})

const isActive = ref(props.modelValue)

function close () {
  isActive.value = false
}

watch(isActive, value => emit('update:modelValue', value))
watch(() => props.modelValue, value => { isActive.value = value })
</script>
