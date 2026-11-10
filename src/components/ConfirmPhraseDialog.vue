<script lang="ts" setup>
/**
 * Confirmation dialog for actions that can't be undone: the user has to type
 * `phrase` before the confirm button is enabled.
 * Closes when `confirm` resolves, and shows the error if it rejects.
 */
import { computed, shallowRef } from 'vue'

import { parseRestError } from '@/utils/restApi'
import { Color } from '@/utils/types'

import DefaultDialog from './DefaultDialog.vue'

const props = withDefaults(
  defineProps<{
    confirm: () => Promise<unknown>
    phrase: string
    color?: Color
    confirmText?: string
    text?: string
    title?: string
  }>(),
  { color: 'warning' }
)

const isOpen = shallowRef(false)
const input = shallowRef('')
const error = shallowRef<string>()
const working = shallowRef(false)

const matches = computed(() => input.value.trim() === props.phrase)

function reset() {
  input.value = ''
  error.value = undefined
}

async function submit() {
  if (!matches.value || working.value) return
  working.value = true
  error.value = undefined
  try {
    await props.confirm()
    isOpen.value = false
  } catch (e) {
    error.value = Object.values(parseRestError(e)).flat().join(' ')
  }
  working.value = false
}
</script>

<template>
  <DefaultDialog
    v-model="isOpen"
    :persistent="working"
    :title="title"
    @open="reset"
  >
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs"></slot>
    </template>
    <template #default="{ close }">
      <div class="mb-4">
        <slot>
          <p>{{ text }}</p>
        </slot>
      </div>
      <v-alert class="mb-4" type="info">
        <i18n-t keypath="confirmPhrase.help" tag="span">
          <template #phrase>
            <strong>{{ phrase }}</strong>
          </template>
        </i18n-t>
      </v-alert>
      <form @submit.prevent="submit">
        <v-text-field
          v-model="input"
          autocomplete="off"
          autofocus
          :disabled="working"
          :label="$t('confirm')"
        />
        <v-alert v-if="error" class="mb-4" :text="error" type="error" />
        <div class="d-flex ga-1 justify-end">
          <v-btn
            :disabled="working"
            :text="$t('cancel')"
            variant="text"
            @click="close"
          />
          <v-btn
            :color="color"
            :disabled="!matches"
            :loading="working"
            :text="confirmText || $t('confirm')"
            type="submit"
            variant="flat"
          />
        </div>
      </form>
    </template>
  </DefaultDialog>
</template>
