<template>
  <v-dialog v-model="isOpen">
    <template #activator="{ props }">
      <slot name="activator" :props="props">
        <v-btn :prepend-icon="activatorIcon" color="primary" v-bind="props">
          {{ t('proposal.add') }}
        </v-btn>
      </slot>
    </template>
    <v-sheet color="background" class="pa-4 d-flex flex-column overflow-y-auto" v-bind="dialogDefaults">
      <v-expand-transition>
        <form @submit.prevent="preview()" v-show="!done">
          <slot name="editor">
            <RichtextEditor v-model="body" class="proposal-editor mb-2" :placeholder="t('proposal.postPlaceholder')" />
          </slot>
          <div class="d-flex flex-column flex-md-row" id="post-as">
            <v-autocomplete v-if="postAsOptions" :label="t('proposal.postAs')" :items="postAsOptions" v-model="postAs" v-model:search="postAsSearch" />
            <!-- <v-select v-if="postAsOptions" v-model="group" :label="t('proposal.postAs')" :items="postAsOptions" :transition="false" /> -->
            <v-spacer />
            <slot name="actions" />
          </div>
        </form>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="!proposal">
          <p v-if="errorText" class="my-6 text-center text-error">
            {{ errorText }}
          </p>
          <p class="text-center my-6" v-else-if="previewing">
            <v-progress-circular color="primary" indeterminate />
          </p>
        </div>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="proposal" id="proposal-preview">
          <Proposal readOnly :p="proposal" class="my-6" :class="{ previewing }" />
        </div>
      </v-expand-transition>
      <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8" />
      <v-spacer />
      <div v-if="done" class="text-right mt-4">
        <v-btn variant="contained" color="primary" @click="isOpen = false">
          {{ t('close') }}
        </v-btn>
      </div>
      <div v-else class="text-right mt-4">
        <v-btn variant="text" @click="isOpen = false">
          {{ t('cancel') }}
        </v-btn>
        <v-btn variant="contained" color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="!proposal || previewing || saving" @click="addProposal()">
          {{ t('publish') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useAuthentication from '@/composables/useAuthentication'
import ProposalVue from '@/modules/proposals/Proposal.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import { proposalType } from './contentTypes'
import useAgendaItem from '../agendas/useAgendaItem'
import { PreviewProposal, Proposal } from './types'
import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useDefaults from '@/composables/useDefaults'
import { parseRestError } from '@/utils/restApi'
import { stripHTML } from '@/utils'
import { userType } from '../organisations/contentTypes'

const previewDelay = 500 // Wait 1 s before preview
let previewTimeout: number

interface AutocompleteItem {
  value: string
  title: string
}

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
    modelValue: {
      type: String,
      default: ''
    }
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const body = ref(props.modelValue)
    const { meetingId } = useMeeting()
    const { agendaId, agendaItem } = useAgendaItem()
    const isOpen = ref(false)
    const { userGroups } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()
    const { getMeetingGroup } = useMeetingGroups(meetingId)

    function getAuthor (): Partial<Proposal> {
      if (!postAs.value) return {}
      const [type, pk] = postAs.value.split(':')
      return type === 'group'
        ? { meeting_group: Number(pk) }
        : { author: Number(pk) }
    }

    function getPostData (): Partial<Proposal> {
      return {
        shortname: props.shortname,
        agenda_item: agendaId.value,
        body: body.value,
        ...getAuthor(),
        ...props.extra
      }
    }

    const api = proposalType.getContentApi({ alertOnError: false })
    const proposal = ref<Partial<Proposal> | null>(null)
    const errors = ref<Record<string, string[]>>({})
    const errorText = computed(() => {
      const errs = errors.value.body ?? errors.value.__root__
      if (!errs) return
      return errs.join(', ')
    })
    async function preview () {
      errors.value = {}
      try {
        const { data } = await api.action<PreviewProposal>('preview', getPostData())
        const baseId = data.meeting_group
          ? getMeetingGroup(data.meeting_group)?.groupid
          : user.value?.userid
        proposal.value = {
          ...data,
          created: new Date(),
          pk: 0,
          prop_id: `${baseId}-{n}`,
          shortname: props.shortname
        }
      } catch (e) {
        proposal.value = null
        errors.value = parseRestError(e)
      }
      previewing.value = false
    }

    const postAs = ref<string | null>(null)
    const postAsSearch = ref('')
    function preserveCurrentAuthor (newOptions?: AutocompleteItem[]): AutocompleteItem[] {
      newOptions = newOptions ?? []
      const { author } = getAuthor()
      const preserve = userOptions.value.find(item => author === Number(item.value.split(':')[1]))
      return preserve
        ? [preserve, ...newOptions]
        : newOptions
    }
    watch(postAsSearch, async (search: string) => {
      if (!search.length) {
        userOptions.value = preserveCurrentAuthor()
        return
      }
      const { data } = await userType.api.list({
        meeting: meetingId.value,
        search
      })
      // eslint-disable-next-line camelcase
      const newOptions = data.map(({ full_name, userid, pk }) => ({ value: `user:${pk}`, title: `${full_name} (${userid})` }))
      userOptions.value = preserveCurrentAuthor(newOptions)
    })
    const userOptions = ref<AutocompleteItem[]>([])
    const postAsOptions = computed(() => {
      if (!userGroups.value.length) return
      return [
        {
          value: null,
          title: user.value?.full_name
        },
        ...userGroups.value.map(({ pk, title }) => ({ value: `group:${pk}`, title })),
        // eslint-disable-next-line camelcase
        ...userOptions.value
      ]
    })

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

    const activatorIcon = computed(() => agendaItem.value?.block_proposals ? 'mdi-lock-outline' : 'mdi-text-box-plus-outline')

    const previewing = ref(false)
    function setPreviewTimeout () {
      clearTimeout(previewTimeout)
      if (!stripHTML(body.value)) {
        previewing.value = false
        proposal.value = null
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

    watch(isOpen, open => {
      if (done.value && !open) {
        body.value = ''
        done.value = false
        emit('reset')
      }
    })

    return {
      t,
      ...useDefaults(),
      activatorIcon,
      done,
      errorText,
      isOpen,
      postAs,
      postAsOptions,
      postAsSearch,
      previewing,
      proposal,
      body,
      saving,
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

#proposal-preview
  .previewing
    opacity: .6
</style>
