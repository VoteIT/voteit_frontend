<template>
  <v-sheet rounded class="pa-3">
    <p class="mb-4 text-center">
      Denna version av VoteIT är under utveckling.
    </p>
    <v-dialog>
      <template #activator="{ props }">
        <v-btn block variant="outlined" v-bind="props" prepend-icon="mdi-alert-decagram">
          Felrapport
        </v-btn>
      </template>
      <template #default="{ isActive }">
        <v-sheet rounded class="pa-4" v-bind="dialogDefaults">
          <div class="d-flex">
            <h2 class="flex-grow-1">
              Felrapport
            </h2>
            <v-btn variant="text" class="mt-n2 mr-n2" icon="mdi-close" size="small" @click="isActive.value = false" />
          </div>
          <template v-if="submitted">
            <p class="mt-2 mb-6 text-secondary">
              Tack för din felrapport!
            </p>
            <v-btn color="secondary" @click="submitted = false" prepend-icon="mdi-undo">
              Ny felrapport
            </v-btn>
          </template>
          <template v-else>
            <p class="my-2">
              VoteIT är under ständig utveckling och vi behöver få in rapporter om konstigheter och buggar så att vi kan förhindra problem i framtiden.
            </p>
            <p class="my-2 text-warning">
              Genom att skicka denna felrapport godkänner du att vi sparar ditt användarnamn tillsammans med felrapporten fram till att problemet är avhjälpt eller som längst ett år.
            </p>
            <SchemaForm :schema="schema" class="mt-4" :handler="submit" @saved="submitted = true">
              <template #buttons="{ disabled, valid }">
                <div class="text-right">
                  <v-btn type="submit" color="primary" prepend-icon="mdi-send" :disabled="disabled || !valid">
                    Skicka
                  </v-btn>
                </div>
              </template>
            </SchemaForm>
          </template>
        </v-sheet>
      </template>
    </v-dialog>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import useDefaults from '@/composables/useDefaults'
import SchemaForm from '@/components/SchemaForm.vue'

import { bugReportType } from './contentTypes'
import { BugReport } from './types'
import schema from './schema'
import useMeeting from '../meetings/useMeeting'

export default defineComponent({
  components: {
    SchemaForm
  },
  setup () {
    const { meetingId } = useMeeting()

    const submitted = ref(false)

    async function submit (data: Partial<BugReport>) {
      await bugReportType.api.add({
        ...data,
        meeting: meetingId.value,
        user_platform: {
          userAgent: window.navigator.userAgent,
          viewport: `${window.innerWidth}w ${window.innerHeight}h`
        }
      })
    }

    return {
      schema,
      submitted,
      submit,
      ...useDefaults()
    }
  }
})
</script>
