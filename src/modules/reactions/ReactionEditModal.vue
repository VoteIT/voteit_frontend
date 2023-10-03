<script lang="ts" setup>
import { ComponentPublicInstance, computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'
import QueryDialog from '@/components/QueryDialog.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import UserList from '@/components/UserList.vue'
import useRules from '@/composables/useRules'

import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'

import { ReactionButton, ReactionIcon } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'
import ButtonDisplayCheckboxes from './ButtonDisplayCheckboxes.vue'

const { t } = useI18n()
const rules = useRules(t)
const emit = defineEmits(['close'])
const props = defineProps<{
  data?: ReactionButton
}>()

function getDefaults (btn?: ReactionButton): Partial<ReactionButton> & Pick<ReactionButton, 'allowed_models' | 'change_roles' | 'color' | 'flag_mode' | 'list_roles' | 'meeting'> {
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

const { user } = useAuthentication()
const { meetingId, roleLabels } = useMeeting()
const formData = reactive(getDefaults(props.data))
const transformedData = computed(() => {
  const data = { ...formData }
  if (!data.target) data.target = null
  if (!data.icon) data.icon = '' // Empty string required by API
  return data
})
const previewActive = ref(true)
const previewCount = computed(() => {
  const selected = Number(formData.target) || 100
  return previewActive.value ? selected : selected - 1
})
const submitting = ref(false)

function close () {
  emit('close')
}

const form = ref<ComponentPublicInstance<{ validate(): void }> | null>(null)
watch(form, value => value?.validate(), { immediate: true })
const formValid = ref(true)
const isValid = computed(() => {
  return formValid.value && formData.color && formData.change_roles?.length && formData.list_roles?.length
})

async function save () {
  submitting.value = true
  // Transform target to value or null
  try {
    if (transformedData.value.pk) {
      await reactionButtonType.api.patch(transformedData.value.pk, transformedData.value)
    } else {
      await reactionButtonType.api.add(transformedData.value)
    }
    emit('close')
  } catch (err) {
    submitting.value = false
    console.error(err)
  }
}

async function deleteButton () {
  if (!formData.pk) return
  submitting.value = true
  try {
    await reactionButtonType.api.delete(formData.pk)
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
        <RealReactionButton
          :button="(transformedData as ReactionButton)"
          v-model="previewActive"
          :count="previewCount"
        >
          <template #userList>
            <UserList v-if="user" :user-ids="[user.pk]" />
          </template>
        </RealReactionButton>
      </Widget>
      <v-form @submit.prevent="save" class="mt-4" v-model="formValid" ref="form">
        <v-text-field required :label="t('title')" v-model="formData.title" :rules="[rules.required, rules.maxLength(20)]" />
        <v-text-field :label="t('description')" v-model="formData.description" :rules="[rules.maxLength(100)]" />
        <div>
          <label>{{ t('color') }}</label>
          <v-item-group class="btn-controls" mandatory v-model="formData.color">
            <v-item v-for="value in Object.values(ThemeColor)" :key="value" :value="value" v-slot="{ toggle, isSelected }">
              <v-btn :icon="isSelected ? 'mdi-brush' : 'mdi-circle'" :variant="isSelected ? 'elevated' : 'text'" :color="value" @click="toggle" />
            </v-item>
          </v-item-group>
        </div>
        <div>
          <label>{{ t('icon') }}</label>
          <v-item-group class="btn-controls" v-model="formData.icon">
            <v-item v-for="value in Object.values(ReactionIcon)" :key="value" :value="value" v-slot="{ toggle, isSelected }">
              <v-btn :variant="isSelected ? 'elevated' : 'text'" :color="formData.color" :icon="value" @click="toggle" />
            </v-item>
          </v-item-group>
        </div>
        <ButtonDisplayCheckboxes
          v-model:allowed-models="formData.allowed_models"
          v-model:on-presentation="formData.on_presentation"
          v-model:on-vote="formData.on_vote"
        />
        <div>
          <label>{{ t('reaction.rolesRequired') }}</label>
          <CheckboxMultipleSelect v-model="formData.change_roles" :settings="{ options: roleLabels }" :required-values="['moderator']" />
        </div>
        <div>
          <label>{{ t('reaction.listRolesRequired') }}</label>
          <CheckboxMultipleSelect v-model="formData.list_roles" :settings="{ options: roleLabels }" :required-values="['moderator']" />
        </div>
        <v-text-field type="number" v-model="formData.target" :label="t('reaction.threshold')" :rules="[rules.min(0)]" :hint="t('reaction.thresholdHint')" />
        <div class="btn-controls submit mt-4">
          <v-spacer />
          <v-btn preprend-icon="mdi-cancel" variant="text" color="secondary" @click="close">
            {{ t('cancel') }}
          </v-btn>
          <template v-if="formData.pk">
            <QueryDialog color="warning" :text="t('reaction.deleteButtonConfirmation')" @confirmed="deleteButton">
              <template #activator="{ props }">
                <v-btn prepend-icon="mdi-delete" color="warning" :disabled="submitting" v-bind="props">
                  {{ t('content.delete') }}
                </v-btn>
              </template>
            </QueryDialog>
            <v-btn type="submit" color="primary" prepend-icon="mdi-check" :disabled="!isValid || submitting">
              {{ t('update') }}
            </v-btn>
          </template>
          <v-btn v-else type="submit" color="primary" prepend-icon="mdi-check" :disabled="!isValid || submitting">
            {{ t('create') }}
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
