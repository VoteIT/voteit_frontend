<template>
  <div>
    <header>
      <h1 v-if="data">{{ t('reaction.editButton') }}</h1>
      <h1 v-else>{{ t('reaction.addButton') }}</h1>
    </header>
    <main>
      <Widget>
        <h2>{{ t('preview') }}</h2>
        <v-btn size="small" :title="formData.title" @click="previewActive = !previewActive" :plain="!previewActive" :color="formData.color">
          <v-icon left v-if="formData.icon" :icon="formData.icon" />
          {{ previewActive ? 100 : 99 }}
        </v-btn>
      </Widget>
      <form @submit.prevent>
        <div>
          <label for="reaction-title">{{ t('title') }}</label>
          <input required id="reaction-title" type="text" v-model="formData.title">
        </div>
        <div>
          <label>{{ t('color') }}</label>
          <div class="btn-controls">
            <v-btn :border="formData.color === name" v-for="[value, name] in Object.entries(ThemeColor)" :key="value" :color="name" @click="formData.color = name">
              {{ value }}
            </v-btn>
          </div>
        </div>
        <div>
          <label>{{ t('icon') }}</label>
          <div class="btn-controls">
            <v-btn :color="formData.color" :border="formData.icon === name" v-for="[value, name] in Object.entries(ReactionIcon)" :key="value" :icon="name" @click="formData.icon = name">
            </v-btn>
          </div>
        </div>
        <div>
          <label>{{ t('reaction.modelsAllowed') }}</label>
          <CheckboxMultipleSelect name="allowedModels" v-model="formData.allowed_models" :options="ReactionContentType" />
        </div>
        <div>
          <label>{{ t('reaction.rolesRequired') }}</label>
          <CheckboxMultipleSelect name="changeRoles" v-model="formData.change_roles" :options="MeetingRole" />
        </div>
        <div>
          <label>{{ t('reaction.listRolesRequired') }}</label>
          <CheckboxMultipleSelect name="listRoles" v-model="formData.list_roles" :options="MeetingRole" />
        </div>
        <div class="btn-controls submit">
          <Btn icon="mdi-cancel" color="secondary" @click="close()">
            {{ t('cancel') }}
          </Btn>
          <template v-if="formData.pk">
            <Btn icon="mdi-send" :disabled="!isValid || submitting" @click="save()">
              {{ t('update') }}
            </Btn>
            <Btn icon="mdi-delete" color="warning" :disabled="submitting" @click="deleteButton()">
              {{ t('delete') }}
            </Btn>
          </template>
          <Btn v-else icon="mdi-send" :disabled="!isValid || submitting" @click="save()">
            {{ t('create') }}
          </Btn>
        </div>
      </form>
    </main>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, reactive, ref } from 'vue'

import { ThemeColor } from '@/utils/types'

import reactionButtonType, { ReactionButton, ReactionIcon } from '@/contentTypes/reactionButton'
import { MeetingRole } from '@/contentTypes/types'
import { closeModalEvent, dialogQuery } from '@/utils'

import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import useMeeting from '@/composables/meeting/useMeeting'

enum ReactionContentType {
  DiscussionPost = 'discussion_post',
  Proposal = 'proposal'
}

export default defineComponent({
  components: {
    CheckboxMultipleSelect
  },
  props: {
    data: Object as PropType<ReactionButton>
  },
  setup (props) {
    const t = inject('t') as (text: string) => string
    const { meetingId } = useMeeting()
    const formData = reactive<Partial<ReactionButton>>({ ...(props.data || { color: 'primary', meeting: meetingId.value }) })
    const previewActive = ref(true)
    const submitting = ref(false)
    const api = reactionButtonType.getContentApi()
    function close () {
      closeModalEvent.emit()
    }
    const isValid = computed(() => {
      return formData.title && formData.icon && formData.color && formData.allowed_models?.length && formData.change_roles?.length && formData.list_roles?.length
    })

    async function save () {
      submitting.value = true
      try {
        if (formData.pk) {
          await api.patch(formData.pk, formData)
        } else {
          await api.add(formData)
        }
        closeModalEvent.emit()
      } catch (err) {
        submitting.value = false
        console.error(err)
      }
    }

    async function deleteButton () {
      if (!formData.pk) return
      if (!await dialogQuery(t('reaction.deleteButtonConfirmation'))) return
      submitting.value = true
      try {
        await api.delete(formData.pk)
        closeModalEvent.emit()
      } catch (err) {
        submitting.value = false
        console.error(err)
      }
    }

    return {
      close,
      deleteButton,
      isValid,
      formData,
      previewActive,
      save,
      submitting,
      t,
      ReactionIcon,
      ThemeColor,
      ReactionContentType,
      MeetingRole
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
