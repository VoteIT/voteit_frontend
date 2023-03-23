<template>
  <v-dialog v-model="isActive" v-bind="dialogDefaults" :persistent="persistent">
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs" />
    </template>
    <v-sheet class="pa-4">
      <div class="text-right">
        <v-btn
          v-if="!persistent"
          class="mt-n2 mr-n2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="close"
        />
      </div>
      <p class="mx-4 text-h6">
        <slot>
          {{ text }}
        </slot>
      </p>
      <div class="text-right mt-4">
        <slot name="buttons" :close="close">
          <v-btn
            variant="text"
            @click="close"
            class="mr-1"
          >
            {{ t('no') }}
          </v-btn>
          <v-btn
            variant="flat"
            :color="color"
            @click="confirm"
          >
            {{ confirmText || t('yes') }}
          </v-btn>
        </slot>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useDefaults from '@/composables/useDefaults'
import { Color } from '@/utils/types'

const { t } = useI18n()
const { dialogDefaults } = useDefaults()

const emit = defineEmits(['confirmed'])

interface Props {
  confirmText?: string
  modelValue?: boolean
  persistent?: boolean
  text?: string
  color: Color
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary'
})

const isActive = ref(props.modelValue)

function close () {
  isActive.value = false
}

function confirm () {
  emit('confirmed')
  close()
}
</script>
