<template>
  <main>
    <v-form @submit.prevent="addMeeting()" v-model="formReady">
      <v-text-field
        :label="t('title')"
        autocomplete="off"
        v-model="formData.title"
        :rules="[rules.minLength(5), rules.maxLength(100)]"
      />
      <v-select
        v-if="installableDialects"
        v-model="formData.install_dialect"
        class="mb-2"
        clearable
        :hint="t('meeting.dialectHint')"
        :items="dialectOptions"
        label="Mötesdialekt"
        persistent-hint
      />
      <v-select
        v-model="formData.er_policy_name"
        class="mb-2"
        clearable
        :disabled="!!formData.install_dialect"
        :hint="t('meeting.erHint')"
        :items="erOptions"
        :label="t('electoralRegister.method')"
        persistent-hint
      />
      <div>
        <v-checkbox color="primary" v-model="formData.visible_in_lists" :label="t('meeting.visibleInLists')" />
      </div>
      <div class="text-right">
        <v-btn variant="text" @click="$emit('close')">
          {{ t('cancel') }}
        </v-btn>
        <v-btn type="submit" color="primary" prepend-icon="mdi-send" :disabled="!formReady">
          {{ t('create') }}
        </v-btn>
      </div>
    </v-form>
  </main>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import { meetingType } from './contentTypes'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import useDialects from './dialects/useDialects'
import useRules from '@/composables/useRules'

defineEmits(['close'])

const { t } = useI18n()
const router = useRouter()
const { erMethods } = useElectoralRegisters()
const { installableDialects } = useDialects()
const rules = useRules(t)

const formData = reactive({
  title: '',
  visible_in_lists: false,
  er_policy_name: undefined,
  install_dialect: undefined
})
const formReady = ref(false)

watch(() => formData.install_dialect, value => {
  if (value) formData.er_policy_name = undefined
})
const submitting = ref(false)

const erOptions = computed(() => {
  return erMethods.map(({ name }) => ({ value: name, title: t(`erMethods.${name}.title`) }))
})

const dialectOptions = computed(() => {
  if (!installableDialects.value) return []
  return installableDialects.value.map(({ name, title }) => ({ value: name, title }))
})

async function addMeeting () {
  if (submitting.value) return
  submitting.value = true
  try {
    const { data } = await meetingType.api.add(formData)
    router.push(`/m/${data.pk}/${slugify(data.title)}`)
  } catch {
    // TODO
  }
  submitting.value = false
}
</script>
