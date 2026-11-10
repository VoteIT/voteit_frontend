<script lang="ts" setup>
/**
 * Confirmation dialog with its own activator.
 * Closes when `confirm` resolves, and shows the error if it rejects.
 * Don't use inside a v-menu: its dialog is part of the menu content, which keeps the menu from closing.
 * Call dialogQuery() from the menu item's click handler instead.
 */
import { inject, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseRestError } from '@/utils/restApi'
import { Color } from '@/utils/types'

const dialogWidth = inject('dialogWidth', 640)

const { t } = useI18n()

interface Props {
  confirm: () => unknown
  confirmText?: string
  modelValue?: boolean
  persistent?: boolean
  text?: string
  color?: Color
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary'
})

const isActive = ref(props.modelValue)
const error = shallowRef<string>()
const working = shallowRef(false)

function close() {
  isActive.value = false
}

async function submit() {
  if (working.value) return
  working.value = true
  error.value = undefined
  try {
    await props.confirm()
    close()
  } catch (e) {
    error.value = Object.values(parseRestError(e)).flat().join(' ')
  }
  working.value = false
}
</script>

<template>
  <v-dialog
    v-model="isActive"
    :width="`${dialogWidth}px`"
    :persistent="persistent || working"
    @after-leave="error = undefined"
  >
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs"></slot>
    </template>
    <v-sheet class="pa-4">
      <div class="text-right">
        <v-btn
          v-if="!persistent"
          class="mt-n2 mr-n2"
          :disabled="working"
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
      <v-alert v-if="error" class="mx-4 mt-4" :text="error" type="error" />
      <div class="text-right mt-4">
        <slot name="buttons" :close="close" :submit="submit" :working="working">
          <v-btn
            class="mr-1"
            :disabled="working"
            :text="$t('no')"
            variant="text"
            @click="close"
          />
          <v-btn
            :color="color"
            :loading="working"
            :text="confirmText || t('yes')"
            variant="flat"
            @click="submit"
          />
        </slot>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<style lang="sass">
p.text-h6
  white-space: pre-line
</style>
