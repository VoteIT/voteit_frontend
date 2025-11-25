<script lang="ts" setup>
import { ComponentPublicInstance, computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import IconSearchInput from '@/components/inputs/IconSearchInput.vue'
import ColorInput from '@/components/inputs/ColorInput.vue'
import UserList from '@/components/UserList.vue'
import Widget from '@/components/Widget.vue'
import useRules from '@/composables/useRules'

import useAuthStore from '../auth/useAuthStore'
import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'

import { ReactionButton } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'
import ButtonDisplayCheckboxes from './ButtonDisplayCheckboxes.vue'

const { t } = useI18n()
const rules = useRules(t)
const emit = defineEmits(['close'])
const props = defineProps<{
  data?: ReactionButton
}>()

function getDefaults(
  btn?: ReactionButton
): Partial<ReactionButton> &
  Pick<
    ReactionButton,
    | 'allowed_models'
    | 'change_roles'
    | 'color'
    | 'flag_mode'
    | 'list_roles'
    | 'meeting'
  > {
  if (btn) return { ...btn }
  return {
    allowed_models: ['discussion_post', 'proposal'],
    change_roles: [MeetingRole.Moderator],
    color: 'primary',
    description: '',
    flag_mode: false,
    list_roles: [MeetingRole.Moderator],
    meeting: meetingId.value
  }
}

const authStore = useAuthStore()
const { meetingId, roleLabels } = useMeeting()
const formData = reactive(getDefaults(props.data))
const transformedData = computed(() => {
  const data = { ...formData }
  if (!data.target) data.target = null
  if (!data.icon) data.icon = '' // Empty string required by API
  return data as ReactionButton
})
const previewActive = ref(true)
const previewCount = computed(() => {
  const selected = Number(formData.target) || 100
  return previewActive.value ? selected : selected - 1
})
const submitting = ref(false)

function close() {
  emit('close')
}

const form = ref<ComponentPublicInstance<{ validate(): void }> | null>(null)
watch(form, (value) => value?.validate(), { immediate: true })
const formValid = ref(true)
const isValid = computed(() => {
  return (
    formValid.value &&
    formData.color &&
    formData.change_roles?.length &&
    formData.list_roles?.length
  )
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
          {{ $t('preview') }}
        </h2>
        <RealReactionButton
          :button="transformedData"
          v-model="previewActive"
          :count="previewCount"
        >
          <template #userList>
            <UserList v-if="authStore.user" :user-ids="[authStore.user.pk]" />
          </template>
        </RealReactionButton>
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
        <div>
          <CheckboxMultipleSelect
            :label="$t('reaction.rolesRequired')"
            :required-values="['moderator']"
            :settings="{ options: roleLabels }"
            v-model="formData.change_roles"
          />
        </div>
        <div>
          <CheckboxMultipleSelect
            :label="$t('reaction.listRolesRequired')"
            :required-values="['moderator']"
            :settings="{ options: roleLabels }"
            v-model="formData.list_roles"
          />
        </div>
        <v-text-field
          type="number"
          v-model="formData.target"
          :label="$t('reaction.threshold')"
          :rules="[rules.min(0)]"
          :hint="$t('reaction.thresholdHint')"
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
