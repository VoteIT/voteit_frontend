<template>
  <v-sheet color="background" class="pa-4 d-flex flex-column overflow-y-auto" v-bind="dialogDefaults">
    <v-expand-transition>
      <form @submit.prevent="preview()" v-show="!done">
        <slot name="editor">
          <RichtextEditor v-model="body" class="proposal-editor mb-2" :placeholder="t('proposal.postPlaceholder')" />
        </slot>
        <div class="d-flex flex-column flex-md-row" id="post-as">
          <v-autocomplete
            v-if="postAsOptions"
            :label="t('proposal.postAs')"
            :items="postAsOptions"
            v-model="postAs"
            v-model:search="postAsSearch"
            :no-data-text="t('noSuggestions')"
            />
          <v-spacer />
          <slot name="actions" />
        </div>
      </form>
    </v-expand-transition>
    <v-expand-transition>
      <div v-if="!proposalPreview">
        <p v-if="errorText" class="my-6 text-center text-error">
          {{ errorText }}
        </p>
        <p class="text-center my-6" v-else-if="previewing">
          <v-progress-circular color="primary" indeterminate />
        </p>
      </div>
    </v-expand-transition>
    <v-expand-transition>
      <div v-if="proposalPreview" id="proposal-preview">
        <Proposal readOnly :p="proposalPreview" class="my-6" :class="{ previewing }" />
      </div>
    </v-expand-transition>
    <v-spacer />
    <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8 flex-grow-0" />
    <div v-if="done" class="text-right mt-4">
      <v-btn variant="contained" color="primary" @click="$emit('close')">
        {{ t('close') }}
      </v-btn>
    </div>
    <div v-else class="text-right mt-4">
      <v-btn variant="text" @click="$emit('close')">
        {{ t('cancel') }}
      </v-btn>
      <v-btn variant="contained" color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="!proposalPreview || previewing || saving" @click="saveProposal()">
        {{ proposal ? t('update') : t('publish') }}
      </v-btn>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { stripHTML } from '@/utils'
import { parseRestError } from '@/utils/restApi'

import useAuthentication from '@/composables/useAuthentication'
import useDefaults from '@/composables/useDefaults'
import RichtextEditor from '@/components/RichtextEditor.vue'
import { proposalType } from './contentTypes'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'
import { userType } from '../organisations/contentTypes'
import useUserDetails from '../organisations/useUserDetails'

import type { User } from '../organisations/types'
import type { PreviewProposal, Proposal } from './types'

const previewDelay = 500 // Wait 1 s before preview
let previewTimeout: number

interface AutocompleteItem {
  value: string
  title: string
}

export default defineComponent({
  emits: ['close'],
  components: {
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
    modelValue: {
      type: String,
      default: ''
    },
    proposal: Object as PropType<Proposal>
  },
  setup (props) {
    const { t } = useI18n()
    const body = ref(
      props.proposal
        ? props.proposal.body
        : props.modelValue
    )
    const { meetingId, isModerator } = useMeeting()
    const { agendaId } = useAgendaItem()
    const { userGroups } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()
    const { getUser } = useUserDetails()

    function getAuthor (): Partial<Proposal> {
      if (!postAs.value) return {}
      const [type, pk] = postAs.value.split(':') // Format: 'group:<pk>' or 'user:<pk>'
      return type === 'group'
        ? { meeting_group: Number(pk) } // If meeting_group, don't modify author
        : { meeting_group: null, author: Number(pk) } // If author, ensure meeting_group is null
    }

    function getPatchData (): Partial<Proposal> {
      return {
        body: body.value,
        ...getAuthor()
      }
    }

    function getCreateData (): Partial<Proposal> {
      return {
        shortname: props.shortname,
        agenda_item: agendaId.value,
        ...props.extra,
        ...getPatchData()
      }
    }

    const api = proposalType.getContentApi({ alertOnError: false })
    const proposalPreview = ref<Partial<Proposal> | null>(null)
    const errors = ref<Record<string, string[]>>({})
    const errorText = computed(() => {
      const errs = errors.value.body ?? errors.value.__root__
      if (!errs) return
      return errs.join(', ')
    })
    async function preview () {
      errors.value = {}
      if (!body.value) return
      try {
        const { data } = await api.action<PreviewProposal>('preview', getCreateData())
        proposalPreview.value = {
          ...data,
          created: new Date(),
          pk: 0,
          shortname: props.shortname
        }
      } catch (e) {
        proposalPreview.value = null
        errors.value = parseRestError(e)
      }
      previewing.value = false
    }

    function userToAutocomplete (user: User): AutocompleteItem {
      return {
        title: `${user.full_name} (${user.userid})`,
        value: `user:${user.pk}`
      }
    }
    const postAs = ref<string | null>(
      props.proposal
        ? props.proposal.meeting_group
          ? `group:${props.proposal.meeting_group}`
          : `user:${props.proposal.author}`
        : `user:${user.value?.pk}`
    )
    const postAsSearch = ref('')
    function getInitialUserOption () {
      if (props.proposal && props.proposal.author && props.proposal.author !== user.value?.pk) {
        const author = getUser(props.proposal.author)
        if (author) return [userToAutocomplete(author)]
      }
      return []
    }
    const userOptions = ref<AutocompleteItem[]>(getInitialUserOption())

    function preserveCurrentAuthor (newOptions?: AutocompleteItem[]): AutocompleteItem[] {
      newOptions = newOptions ?? []
      const { author } = getAuthor()
      if (!author) return newOptions
      const finder = (item: AutocompleteItem) => author === Number(item.value.split(':')[1])
      // Ok, it's in the new options as well
      if (newOptions.find(finder)) return newOptions
      // Not in new options - preserve this
      const preserve = userOptions.value.find(finder)
      // Should always find this, but let's not take anything for granted
      return preserve
        ? [preserve, ...newOptions]
        : newOptions
    }

    watch(postAsSearch, async (search: string) => {
      // Only moderators can switch user
      if (!isModerator) return
      if (!search.length) {
        userOptions.value = preserveCurrentAuthor()
        return
      }
      const { data } = await userType.api.list({
        meeting: meetingId.value,
        search
      })
      const newOptions = data
        .filter(({ pk }) => user.value?.pk !== pk)
        .map(userToAutocomplete)
      userOptions.value = preserveCurrentAuthor(newOptions)
    })
    const postAsOptions = computed(() => {
      if (!isModerator || !userGroups.value.length) return
      return [
        user.value
          ? userToAutocomplete(user.value)
          : { // Should not happen
            value: null,
            title: 'self'
          },
        ...userGroups.value.map(({ pk, title }) => ({ value: `group:${pk}`, title })),
        ...userOptions.value
      ]
    })

    const saving = ref(false)
    const done = ref(false)
    async function saveProposal () {
      saving.value = true
      try {
        if (props.proposal) await proposalType.api.patch(props.proposal.pk, getPatchData())
        else await proposalType.api.add(getCreateData())
        done.value = true
      } catch {}
      saving.value = false
    }

    const previewing = ref(false)
    function setPreviewTimeout () {
      clearTimeout(previewTimeout)
      if (!stripHTML(body.value)) {
        previewing.value = false
        proposalPreview.value = null
        return
      }
      previewing.value = true
      previewTimeout = setTimeout(
        preview,
        previewDelay
      )
    }

    watch(body, setPreviewTimeout)
    watch(postAs, preview)
    watch(() => props.modelValue, value => { // React when used as subcomponent, i.e. in AddTextProposalModal
      body.value = value
    })

    return {
      t,
      ...useDefaults(),
      done,
      errorText,
      postAs,
      postAsOptions,
      postAsSearch,
      previewing,
      proposalPreview,
      body,
      saving,
      user,
      userGroups,
      saveProposal,
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

#proposal-preview
  .previewing
    opacity: .6
</style>
