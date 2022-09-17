<template>
  <div>
    <main>
      <Widget>
        <h2>{{ t('preview') }}</h2>
        <RealReactionButton
          :button="formData"
          v-model="previewActive"
          :count="previewActive ? 100 : 99"
        >
          <template #userList>
            <UserList v-if="user" :user-ids="[user.pk]" />
          </template>
        </RealReactionButton>
      </Widget>
      <form @submit.prevent="save()" class="mt-4">
        <v-text-field dark required :label="t('title')" v-model="formData.title" />
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
        <div class="btn-controls submit">
          <v-spacer />
          <v-btn preprend-icon="mdi-cancel" variant="text" color="secondary" @click="close()">
            {{ t('cancel') }}
          </v-btn>
          <template v-if="formData.pk">
            <v-btn prepend-icon="mdi-delete" color="warning" :disabled="submitting" @click="deleteButton()">
              {{ t('delete') }}
            </v-btn>
            <v-btn type="submit" color="primary" prepend-icon="mdi-check" :disabled="!isValid || submitting">
              {{ t('update') }}
            </v-btn>
          </template>
          <v-btn v-else type="submit" color="primary" prepend-icon="mdi-check" :disabled="!isValid || submitting">
            {{ t('create') }}
          </v-btn>
        </div>
      </form>
    </main>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'

import { dialogQuery } from '@/utils'
import { closeModalEvent } from '@/utils/events'

import useAuthentication from '@/composables/useAuthentication'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useMeeting from '@/modules/meetings/useMeeting'
import UserList from '@/components/UserList.vue'
import { ReactionButton, ReactionIcon } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'

export default defineComponent({
  components: {
    CheckboxMultipleSelect,
    RealReactionButton,
    UserList
},
  props: {
    data: Object as PropType<ReactionButton>
  },
  setup (props) {
    const { t } = useI18n()
    const { user } = useAuthentication()
    const { meetingId, roleLabels } = useMeeting()
    const formData = reactive<Partial<ReactionButton>>({ ...(props.data || { color: 'primary', meeting: meetingId.value }) })
    const previewActive = ref(true)
    const submitting = ref(false)
    function close () {
      closeModalEvent.emit()
    }
    const isValid = computed(() => {
      return formData.title && formData.icon && formData.color && formData.change_roles?.length && formData.list_roles?.length
    })

    async function save () {
      submitting.value = true
      try {
        if (formData.pk) {
          await reactionButtonType.api.patch(formData.pk, formData)
        } else {
          await reactionButtonType.api.add(formData)
        }
        closeModalEvent.emit()
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
      if (!await dialogQuery({
        title: t('reaction.deleteButtonConfirmation'),
        theme: ThemeColor.Warning
      })) return
      submitting.value = true
      try {
        await reactionButtonType.api.delete(formData.pk)
        closeModalEvent.emit()
      } catch (err) {
        submitting.value = false
        console.error(err)
      }
    }

    return {
      t,
      contentTypeLabels,
      isValid,
      formData,
      previewActive,
      submitting,
      ReactionIcon,
      roleLabels,
      ThemeColor,
      user,
      close,
      deleteButton,
      save
    }
  }
})
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
