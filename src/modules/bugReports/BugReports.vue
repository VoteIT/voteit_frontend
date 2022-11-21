<template>
  <v-sheet rounded class="pa-3">
    <p class="mb-4 text-center">
      Hittat ett fel i VoteIT?
    </p>
    <DefaultDialog title="Felrapport">
      <template #activator="{ props }">
        <v-btn block variant="outlined" v-bind="props" prepend-icon="mdi-alert-decagram">
          Felrapport
        </v-btn>
      </template>
      <template #default="{ close }">
        <template v-if="submitted">
          <p class="mt-2 mb-6 text-secondary">
            Tack för din felrapport!
          </p>
          <v-btn color="secondary" @click="submitted = false" prepend-icon="mdi-undo">
            Ny felrapport
          </v-btn>
        </template>
        <template v-else>
          <p class="my-2">Skicka gärna en felrapport om du hittat ett fel i VoteIT!</p>
          <p class="my-2">
            Tänk på att VoteIT bygger på ideellt engagemang, det finns ingen anställd support som jobbar med att ta emot den här sortens ärenden.
            Om du har frågor om VoteIT så använd projektets slackkanal dit organisationansvariga har blivit inbjudna.
          </p>
          <p class="my-2">
            Genom att skicka denna felrapport godkänner du att vi sparar ditt användarnamn tillsammans med felrapporten som längst ett år.
          </p>
          <SchemaForm :schema="schema" class="mt-4" :handler="submit" @saved="submitted = true">
            <template #buttons="{ disabled, submitting }">
              <div class="text-right">
                <v-btn variant="text" @click="close" :disabled="submitting">
                  {{ t('cancel') }}
                </v-btn>
                <v-btn type="submit" color="primary" prepend-icon="mdi-send" :loading="submitting" :disabled="disabled">
                  Skicka
                </v-btn>
              </div>
            </template>
          </SchemaForm>
        </template>
      </template>
    </DefaultDialog>
  </v-sheet>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import SchemaForm from '@/components/SchemaForm.vue'

import { bugReportType } from './contentTypes'
import { BugReport } from './types'
import schema from './schema'
import useMeeting from '../meetings/useMeeting'
import DefaultDialog from '@/components/DefaultDialog.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
</script>
