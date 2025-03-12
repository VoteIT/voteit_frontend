<template>
  <v-sheet rounded class="pa-3">
    <p class="mb-4 text-center">Hittat ett fel i VoteIT?</p>
    <DefaultDialog title="Felrapport">
      <template #activator="{ props }">
        <v-btn
          block
          prepend-icon="mdi-alert-decagram"
          text="Felrapport"
          variant="outlined"
          v-bind="props"
        />
      </template>
      <template #default="{ close }">
        <template v-if="submitted">
          <p class="mt-2 mb-6 text-secondary">Tack för din felrapport!</p>
          <v-btn
            color="secondary"
            prepend-icon="mdi-undo"
            text="Ny felrapport"
            @click="submitted = false"
          />
        </template>
        <template v-else>
          <p class="my-2">
            Skicka gärna en felrapport om du hittat ett fel i VoteIT!
          </p>
          <p class="my-2">
            Tänk på att VoteIT bygger på ideellt engagemang, det finns ingen
            anställd support som jobbar med att ta emot den här sortens ärenden.
            Om du har frågor om VoteIT så använd projektets slackkanal dit
            organisationansvariga har blivit inbjudna.
          </p>
          <p class="my-2">
            Genom att skicka denna felrapport godkänner du att vi sparar ditt
            användarnamn tillsammans med felrapporten som längst ett år.
          </p>
          <SchemaForm
            :schema="schema as FormSchema"
            class="mt-4"
            :handler="submit"
            @saved="submitted = true"
          >
            <template #buttons="{ disabled, submitting }">
              <div class="text-right">
                <v-btn
                  :disabled="submitting"
                  :text="$t('cancel')"
                  variant="text"
                  @click="close"
                />
                <v-btn
                  color="primary"
                  :disabled="disabled"
                  :loading="submitting"
                  prepend-icon="mdi-send"
                  text="Skicka"
                  type="submit"
                />
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
import DefaultDialog from '@/components/DefaultDialog.vue'
import { FormSchema } from '@/components/types'

import useMeetingId from '../meetings/useMeetingId'

import { bugReportType } from './contentTypes'
import { BugReport } from './types'
import schema from './schema'

const meetingId = useMeetingId()

const submitted = ref(false)

async function submit(data: Partial<BugReport>) {
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
