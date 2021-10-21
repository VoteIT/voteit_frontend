<template>
  <v-dialog v-model="isOpen">
    <template #activator="{ props }">
      <v-btn prepend-icon="mdi-text-box-plus-outline" color="primary" v-bind="props">
        {{ t('proposal.add') }}
      </v-btn>
    </template>
    <v-sheet color="background" class="pa-4 d-flex flex-column" width="640" max-width="90vw" min-height="580">
      <v-expand-transition>
        <form @submit.prevent="preview()" v-show="!done">
          <RichtextEditor v-model="body" class="proposal-editor mb-2" :placeholder="t('proposal.postPlaceholder')" />
          <div class="btn-group text-right">
            <v-btn type="submit" color="primary" prepend-icon="mdi-text-box-outline" :disabled="!!proposal">{{ t('preview') }}</v-btn>
          </div>
        </form>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="proposal">
          <v-divider class="my-8" v-if="!done" />
          <Richtext v-model="proposal.body" />
        </div>
      </v-expand-transition>
      <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8" />
      <v-spacer />
      <div v-if="done" class="text-right">
        <v-btn color="primary" @click="isOpen = false">
          {{ t('close') }}
        </v-btn>
      </div>
      <div v-else class="text-right">
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
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import { proposalType } from './contentTypes'
import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal } from './types'

export default defineComponent({
  components: {
    Richtext,
    RichtextEditor
  },
  setup () {
    const { t } = useI18n()
    const body = ref('')
    const { agendaId } = useAgendaItem()
    const isOpen = ref(false)

    function getPostData (): Partial<Proposal> {
      return {
        shortname: 'proposal',
        agenda_item: agendaId.value,
        body: body.value
      }
    }

    const proposal = ref<Proposal | null>(null)
    async function preview () {
      const { data } = await proposalType.api.action<Proposal>('preview', getPostData())
      proposal.value = data
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

    watch(isOpen, open => {
      if (done.value && !open) {
        body.value = ''
        done.value = false
      }
    })

    return {
      t,
      done,
      isOpen,
      proposal,
      body,
      saving,
      addProposal,
      preview
    }
  }
})
</script>

<style lang="sass">
.proposal-editor .ql-editor
  min-height: 140px
</style>
