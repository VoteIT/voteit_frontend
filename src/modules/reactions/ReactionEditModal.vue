<template>
  <div>
    <main>
      <Widget>
        <h2>{{ t('preview') }}</h2>
        <RealReactionButton
          :button="transformedData"
          v-model="previewActive"
          :count="previewCount"
        >
          <template #userList>
            <UserList v-if="user" :user-ids="[user.pk]" />
          </template>
        </RealReactionButton>
      </Widget>
      <v-form @submit.prevent="save()" class="mt-4" v-model="formValid" ref="form">
        <v-text-field dark required :label="t('title')" v-model="formData.title" :rules="[rules.required]" />
        <div>
          <label>{{ t('color') }}</label>
          <v-item-group class="btn-controls" mandatory v-model="formData.color">
            <v-item v-for="value in Object.values(ThemeColor)" :key="value" :value="value" v-slot="{ toggle, isSelected }">
              <v-btn :icon="isSelected ? 'mdi-brush' : 'mdi-circle'" :variant="isSelected ? 'elevated' : 'text'" :color="value" @click="toggle()" />
            </v-item>
          </v-item-group>
        </div>
        <div>
          <label>{{ t('icon') }}</label>
          <v-item-group class="btn-controls" mandatory v-model="formData.icon">
            <v-item v-for="value in Object.values(ReactionIcon)" :key="value" :value="value" v-slot="{ toggle, isSelected }">
              <v-btn :variant="isSelected ? 'elevated' : 'text'" :color="formData.color" :icon="value" @click="toggle()" />
            </v-item>
          </v-item-group>
        </div>
        <div>
          <label>{{ t('reaction.modelsAllowed') }}</label>
          <CheckboxMultipleSelect v-model="formData.allowed_models" :settings="{ options: contentTypeLabels }" />
        </div>
        <div>
          <label>{{ t('reaction.rolesRequired') }}</label>
          <CheckboxMultipleSelect v-model="formData.change_roles" :settings="{ options: roleLabels }" />
        </div>
        <div>
          <label>{{ t('reaction.listRolesRequired') }}</label>
          <CheckboxMultipleSelect v-model="formData.list_roles" :settings="{ options: roleLabels }" />
        </div>
        <v-text-field type="number" v-model="formData.target" :label="t('reaction.threshold')" :rules="[rules.min(0)]" :hint="t('reaction.thresholdHint')" />
        <div class="btn-controls submit mt-4">
          <v-spacer />
          <v-btn preprend-icon="mdi-cancel" variant="text" color="secondary" @click="close()">
            {{ t('cancel') }}
          </v-btn>
          <template v-if="formData.pk">
            <QueryDialog color="warning" :text="t('reaction.deleteButtonConfirmation')" @confirmed="deleteButton()">
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

<script lang="ts" setup>
import { ComponentPublicInstance, computed, PropType, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'
import QueryDialog from '@/components/QueryDialog.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import UserList from '@/components/UserList.vue'
import useMeeting from '@/modules/meetings/useMeeting'

import { ReactionButton, ReactionIcon } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'
import useRules from '@/composables/useRules'

const { t } = useI18n()
const rules = useRules(t)
const emit = defineEmits(['close'])
const props = defineProps({
  data: Object as PropType<ReactionButton>
})

const { user } = useAuthentication()
const { meetingId, roleLabels } = useMeeting()
const formData = reactive<Partial<ReactionButton>>({ ...(props.data || { color: 'primary', meeting: meetingId.value }) })
const transformedData = computed(() => ({ ...formData, target: Number(formData.target) || null }))
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
  return formValid.value && formData.icon && formData.color && formData.change_roles?.length && formData.list_roles?.length
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

/* Checkboxes options */
const contentTypeLabels = computed(() => {
  return {
    discussion_post: t('discussion.discussions'),
    proposal: t('proposal.proposals')
  }
})

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

<style lang="sass" scoped>
.widget
  width: 200px
  margin: 0 auto
  text-align: center
  button
    margin: 1em 0 2em

.submit
  text-align: center
</style>
