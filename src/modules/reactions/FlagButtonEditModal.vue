<script lang="ts" setup>
import { ComponentPublicInstance, computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'
import UserList from '@/components/UserList.vue'
import Widget from '@/components/Widget.vue'
import useRules from '@/composables/useRules'

import useMeeting from '../meetings/useMeeting'

import { IFlagButton, ReactionIcon } from './types'
import { reactionButtonType } from './contentTypes'
import FlagButton from './FlagButton.vue'
import ButtonDisplayCheckboxes from './ButtonDisplayCheckboxes.vue'

const { t } = useI18n()
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

const { user } = useAuthentication()
const { meetingId } = useMeeting()
const formData = reactive(getDefaults(props.data))
const transformedData = computed(() => {
  // eslint-disable-next-line camelcase, @typescript-eslint/no-unused-vars
  const { change_roles, list_roles, target, ...data } = formData
  if (!data.icon) data.icon = '' // Empty string required by API
  return data
})
const previewActive = ref(true)
const submitting = ref(false)

function close() {
  emit('close')
}

const form = ref<ComponentPublicInstance<{ validate(): void }> | null>(null)
watch(form, (value) => value?.validate(), { immediate: true })
const formValid = ref(true)
const isValid = computed(() => {
  return formValid.value && formData.color
})

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
          {{ t('preview') }}
        </h2>
        <FlagButton
          :button="transformedData as IFlagButton"
          v-model="previewActive"
          :can-toggle="true"
        >
          <template #userList>
            <UserList v-if="user" :user-ids="[user.pk]" />
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
          :label="t('title')"
          v-model="formData.title"
          :rules="[rules.required, rules.maxLength(20)]"
        />
        <v-text-field
          :label="t('description')"
          v-model="formData.description"
          :rules="[rules.maxLength(100)]"
        />
        <div>
          <label>{{ t('color') }}</label>
          <v-item-group class="btn-controls" mandatory v-model="formData.color">
            <v-item
              v-for="value in Object.values(ThemeColor)"
              :key="value"
              :value="value"
              v-slot="{ toggle, isSelected }"
            >
              <v-btn
                :icon="isSelected ? 'mdi-brush' : 'mdi-circle'"
                :variant="isSelected ? 'elevated' : 'text'"
                :color="value"
                @click="toggle"
              />
            </v-item>
          </v-item-group>
        </div>
        <div>
          <label>{{ t('icon') }}</label>
          <v-item-group class="btn-controls" v-model="formData.icon">
            <v-item
              v-for="value in Object.values(ReactionIcon)"
              :key="value"
              :value="value"
              v-slot="{ toggle, isSelected }"
            >
              <v-btn
                :variant="isSelected ? 'elevated' : 'text'"
                :color="formData.color"
                :icon="value"
                @click="toggle"
              />
            </v-item>
          </v-item-group>
        </div>
        <ButtonDisplayCheckboxes
          v-model:allowed-models="formData.allowed_models"
          v-model:on-presentation="formData.on_presentation"
          v-model:on-vote="formData.on_vote"
          v-model:vote-template="formData.vote_template"
        />
        <div class="btn-controls submit mt-4">
          <v-spacer />
          <v-btn
            preprend-icon="mdi-cancel"
            variant="text"
            color="secondary"
            @click="close"
          >
            {{ t('cancel') }}
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            prepend-icon="mdi-check"
            :disabled="!isValid || submitting"
          >
            {{ formData.pk ? t('update') : t('create') }}
          </v-btn>
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
