<script lang="ts" setup>
import { ComponentPublicInstance, computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'

import UserList from '@/components/UserList.vue'
import Widget from '@/components/Widget.vue'
import useRules from '@/composables/useRules'

import useAuthStore from '../auth/useAuthStore'
import useMeetingId from '../meetings/useMeetingId'

import { IFlagButton } from './types'
import { reactionButtonType } from './contentTypes'
import FlagButton from './FlagButton.vue'
import ButtonDisplayCheckboxes from './ButtonDisplayCheckboxes.vue'
import IconSearchInput from '@/components/inputs/IconSearchInput.vue'
import ColorInput from '@/components/inputs/ColorInput.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const rules = useRules(t)
const emit = defineEmits(['close'])
const props = defineProps<{
  data?: IFlagButton
}>()

function getDefaults(
  btn?: IFlagButton
): Partial<IFlagButton> &
  Pick<IFlagButton, 'allowed_models' | 'color' | 'flag_mode' | 'meeting'> {
  if (btn) return { ...btn }
  return {
    allowed_models: ['discussion_post', 'proposal'],
    color: 'primary',
    description: '',
    flag_mode: true,
    meeting: meetingId.value
  }
}

const meetingId = useMeetingId()
const formData = reactive(getDefaults(props.data))
const transformedData = computed(() => {
  const { change_roles, list_roles, target, ...data } = formData
  if (!data.icon) data.icon = '' // Empty string required by API
  return data as IFlagButton
})
const previewActive = ref(true)
const submitting = ref(false)

function close() {
  emit('close')
}

const form = ref<ComponentPublicInstance<{ validate(): void }> | null>(null)
watch(form, (value) => value?.validate(), { immediate: true })
const formValid = ref(true)
const isValid = computed(() => formValid.value && formData.color)

async function save() {
  submitting.value = true
  // Transform target to value or null
  try {
    if (transformedData.value.pk) {
      await reactionButtonType.api.patch(
        transformedData.value.pk,
        transformedData.value
      )
    } else {
      await reactionButtonType.api.add(transformedData.value)
    }
    emit('close')
  } catch (err) {
    submitting.value = false
    console.error(err)
  }
}
</script>

<template>
  <div>
    <main>
      <Widget>
        <h2 class="mb-1">
          {{ $t('preview') }}
        </h2>
        <FlagButton
          :button="transformedData"
          v-model="previewActive"
          :can-toggle="true"
        >
          <template #userList>
            <UserList v-if="authStore.user" :user-ids="[authStore.user.pk]" />
          </template>
        </FlagButton>
      </Widget>
      <v-form
        @submit.prevent="save"
        class="mt-4"
        v-model="formValid"
        ref="form"
      >
        <v-text-field
          required
          :label="$t('title')"
          v-model="formData.title"
          :rules="[rules.required, rules.maxLength(20)]"
        />
        <v-text-field
          :label="$t('description')"
          v-model="formData.description"
          :rules="[rules.maxLength(100)]"
        />
        <ColorInput
          class="mb-2"
          :icon="formData.icon"
          :label="$t('color')"
          v-model="formData.color"
        />
        <IconSearchInput
          class="mb-3"
          :label="$t('icon')"
          v-model="formData.icon"
        >
          <template #icon="{ icon }">
            <v-avatar :color="formData.color" :icon="icon" />
          </template>
        </IconSearchInput>
        <ButtonDisplayCheckboxes
          v-model:allowed-models="formData.allowed_models"
          v-model:on-presentation="formData.on_presentation"
          v-model:on-vote="formData.on_vote"
          v-model:vote-template="formData.vote_template"
        />
        <div class="btn-controls submit mt-4">
          <v-spacer />
          <v-btn
            color="secondary"
            preprend-icon="mdi-cancel"
            :text="$t('cancel')"
            variant="text"
            @click="close"
          />
          <v-btn
            color="primary"
            :disabled="!isValid || submitting"
            prepend-icon="mdi-check"
            :text="formData.pk ? $t('update') : $t('create')"
            type="submit"
          />
        </div>
      </v-form>
    </main>
  </div>
</template>

<style lang="sass" scoped>
.widget
  width: 200px
  margin: 0 auto
  text-align: center
  button
    margin: 1em 0 2em
</style>
