<template>
  <v-dialog v-model="isOpen">
    <template #activator="{ props }">
      <slot name="activator" :props="props">
        <v-btn prepend-icon="mdi-text-box-plus-outline" color="primary" v-bind="props">
          {{ t('proposal.add') }}
        </v-btn>
      </slot>
    </template>
    <v-sheet color="background" class="pa-4 d-flex flex-column overflow-y-auto" v-bind="sheetProps">
      <v-expand-transition>
        <form @submit.prevent="preview()" v-show="!done">
          <slot name="editor">
            <RichtextEditor v-model="body" class="proposal-editor mb-2" :placeholder="t('proposal.postPlaceholder')" />
          </slot>
          <div class="d-flex" id="post-as">
            <v-field active v-if="userGroups.length" density="comfortable" label="Posta som">
              <select name="group" v-model="group" class="v-field__input">
                <option :value="null">
                  {{ user.full_name }}
                </option>
                <option v-for="{ pk, title } in userGroups" :key="pk" :value="pk">
                  {{ title }}
                </option>
              </select>
            </v-field>
            <v-spacer />
            <slot name="actions" />
            <v-btn type="submit" color="primary" prepend-icon="mdi-text-box-outline" :disabled="!!proposal">{{ t('preview') }}</v-btn>
          </div>
        </form>
      </v-expand-transition>
      <v-expand-transition>
      <div v-if="!proposal">
        <p class="my-6 text-center text-secondary">
          {{ t('proposal.previewBeforePublish') }}
        </p>
      </div>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="proposal">
          <Proposal readOnly :p="proposal" class="my-6" />
        </div>
      </v-expand-transition>
      <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8" />
      <v-spacer />
      <div v-if="done" class="text-right mt-4">
        <v-btn color="primary" @click="isOpen = false">
          {{ t('close') }}
        </v-btn>
      </div>
      <div v-else class="text-right mt-4">
        <v-btn variant="text" @click="isOpen = false">
          {{ t('cancel') }}
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="!proposal || saving" @click="addProposal()">
          {{ t('publish') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import useAuthentication from '@/composables/useAuthentication'
import ProposalVue from '@/modules/proposals/Proposal.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import { proposalType } from './contentTypes'
import useAgendaItem from '../agendas/useAgendaItem'
import { PreviewProposal, Proposal } from './types'
import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'

export default defineComponent({
  emits: ['reset'],
  components: {
    Proposal: ProposalVue,
    RichtextEditor
  },
  props: {
    shortname: {
      type: String as PropType<Proposal['shortname']>,
      default: 'proposal'
    },
    extra: {
      type: Object as PropType<Partial<Proposal>>,
      default: () => ({})
    },
    modelValue: String
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { mobile } = useDisplay()
    const body = ref('')
    const group = ref<null | number>(null)
    const { meetingId } = useMeeting()
    const { agendaId } = useAgendaItem()
    const isOpen = ref(false)
    const { userGroups } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()

    function getPostData (): Partial<Proposal> {
      return {
        shortname: props.shortname,
        agenda_item: agendaId.value,
        body: props.modelValue ?? body.value,
        meeting_group: group.value,
        ...props.extra
      }
    }

    const proposal = ref<Partial<Proposal> | null>(null)
    async function preview () {
      const { data } = await proposalType.api.action<PreviewProposal>('preview', getPostData())
      proposal.value = {
        ...data,
        created: new Date(),
        author: user.value?.pk as number,
        pk: 0,
        prop_id: `${user.value?.userid}-XX`,
        shortname: props.shortname
      }
    }

    const saving = ref(false)
    const done = ref(false)
    async function addProposal () {
      saving.value = true
      try {
        await proposalType.api.add(getPostData())
        done.value = true
      } catch {}
      saving.value = false
    }

    watch(body, () => {
      proposal.value = null
    })
    watch(group, () => {
      proposal.value = null
    })
    watch(() => props.modelValue, () => {
      proposal.value = null
    })

    watch(isOpen, open => {
      if (done.value && !open) {
        body.value = ''
        done.value = false
        emit('reset')
      }
    })

    const sheetProps = computed(() => {
      return {
        width: mobile.value ? 280 : 560,
        minHeight: 400,
        maxHeight: '70vh'
      }
    })

    return {
      t,
      done,
      group,
      isOpen,
      proposal,
      body,
      saving,
      sheetProps,
      user,
      userGroups,
      addProposal,
      preview
    }
  }
})
</script>

<style lang="sass">
.proposal-editor .ql-editor
  min-height: 140px

#post-as
  .v-input__details
    display: none
</style>
