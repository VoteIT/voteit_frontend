<script setup lang="ts">
import {
  computed,
  onBeforeMount,
  shallowReactive,
  shallowRef,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { useClipboard } from '@vueuse/core'

import restApi, { parseRestError } from '@/utils/restApi'
import type { RestError } from '@/utils/types'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useRules from '@/composables/useRules'

import useMeeting from '../meetings/useMeeting'

interface IAPIKey {
  name: string
  scopes: string[]
  meeting: number
  prefix: string
  created: string
  last_used: string | null
  revoked: boolean
  expiry_date: string
  key?: string
}

const { t } = useI18n()
const rules = useRules(t)
const { meeting, meetingId } = useMeeting()

const status = shallowReactive({
  fetching: false,
  failed: false
})
const tokens = shallowRef<IAPIKey[]>([])
const scopes = shallowRef<string[]>([])

const formData = shallowReactive({
  name: '',
  scopes: [] as string[]
})

watch(formData, () => (formErrors.value = null))

const { copy, copied } = useClipboard()
const formErrors = shallowRef<RestError<typeof formData> | null>(null)
const creating = shallowRef(false)
const createdToken = shallowRef<{ key: string; name: string } | null>(null)

function onDialogClose() {
  formData.name = ''
  formData.scopes = []
  formErrors.value = null
  createdToken.value = null
}

async function createToken() {
  creating.value = true
  formErrors.value = null
  try {
    const { data } = await restApi.post('meeting-api-token/', {
      meeting: meetingId.value,
      ...formData
    })
    tokens.value = [...tokens.value, data]
    createdToken.value = data
  } catch (e) {
    formErrors.value = parseRestError(e)
  } finally {
    creating.value = false
  }
}

function formatDate(value: string | null) {
  return value
    ? DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_SHORT)
    : '—'
}

const annotatedTokens = computed(() =>
  tokens.value.map((token) => ({
    ...token,
    created: formatDate(token.created),
    last_used: formatDate(token.last_used),
    expiry_date: formatDate(token.expiry_date)
  }))
)

const revokeError = shallowRef<string | null>(null)

async function revokeKey(prefix: string) {
  revokeError.value = null
  try {
    await restApi.delete(`meeting-api-token/${prefix}/`)
    tokens.value = tokens.value.map((t) =>
      t.prefix === prefix ? { ...t, revoked: true } : t
    )
  } catch {
    revokeError.value = t('tokenAPI.revokeError')
  }
}

async function fetchTokenData() {
  status.fetching = true
  try {
    const [tokensResponse, scopesResponse] = await Promise.all([
      restApi.get('meeting-api-token/', {
        params: { meeting: meetingId.value }
      }),
      restApi.get<string[]>('meeting-api-token/scopes/')
    ])
    scopes.value = scopesResponse.data
    tokens.value = tokensResponse.data
    status.failed = false
  } catch {
    status.failed = true
  } finally {
    status.fetching = false
  }
}

onBeforeMount(fetchTokenData)
</script>

<template>
  <div>
    <v-alert
      class="mb-3"
      type="info"
      :title="$t('meeting.advancedSettings')"
      :text="$t('tokenAPI.help')"
    />
    <v-alert
      v-if="status.failed"
      class="my-3"
      type="warning"
      :text="$t('tokenAPI.fetchFailed')"
      :title="$t('tokenAPI.fetchFailedTitle')"
    >
      <template #append>
        <v-btn
          :loading="status.fetching"
          prepend-icon="mdi-refresh"
          :text="$t('tryAgain')"
          @click="fetchTokenData"
        />
      </template>
    </v-alert>
    <v-toolbar
      class="rounded-t-lg"
      :title="
        meeting
          ? $t('tokenAPI.toolbarTitleWithMeeting', { title: meeting.title })
          : $t('tokenAPI.toolbarTitle')
      "
    >
      <DefaultDialog
        :title="$t('tokenAPI.createDialogTitle')"
        @close="onDialogClose"
      >
        <template #activator="{ props }">
          <v-btn
            color="primary"
            prepend-icon="mdi-key-plus"
            :text="$t('tokenAPI.createBtn')"
            variant="tonal"
            v-bind="props"
          />
        </template>
        <template #default="{ close }">
          <template v-if="createdToken">
            <v-alert
              class="mb-4"
              type="warning"
              :title="$t('tokenAPI.saveKeyTitle')"
              :text="$t('tokenAPI.saveKeyText')"
            />
            <v-text-field
              :model-value="createdToken.key"
              :label="$t('tokenAPI.apiKeyLabel')"
              readonly
              variant="outlined"
            >
              <template #append-inner>
                <v-btn
                  :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
                  size="small"
                  variant="text"
                  @click="copy(createdToken!.key)"
                />
              </template>
            </v-text-field>
            <div class="text-right">
              <v-btn :text="$t('close')" variant="text" @click="close" />
            </div>
          </template>
          <v-form v-else @submit.prevent="createToken" v-slot="{ isValid }">
            <v-alert
              v-if="formErrors?.non_field_errors"
              class="mb-4"
              type="error"
              :text="formErrors.non_field_errors.join(', ')"
            />
            <v-text-field
              :label="$t('tokenAPI.tokenNameLabel')"
              :rules="[rules.required, rules.maxLength(50)]"
              :error-messages="formErrors?.name"
              v-model="formData.name"
            />
            <v-select
              :items="scopes"
              :label="$t('tokenAPI.scopes')"
              multiple
              :rules="[rules.required]"
              :error-messages="formErrors?.scopes"
              v-model="formData.scopes"
            />
            <div class="text-right">
              <v-btn :text="$t('cancel')" @click="close" variant="text" />
              <v-btn
                color="primary"
                :disabled="!isValid.value"
                :loading="creating"
                :text="$t('create')"
                type="submit"
              />
            </div>
          </v-form>
        </template>
      </DefaultDialog>
    </v-toolbar>
    <v-alert
      v-if="revokeError"
      class="my-3"
      type="error"
      :text="revokeError"
      closable
      @click:close="revokeError = null"
    />
    <v-data-table
      :items="annotatedTokens"
      :loading="status.fetching"
      :headers="[
        { key: 'name', title: $t('tokenAPI.colTokenName') },
        { key: 'prefix', title: $t('tokenAPI.colPrefix') },
        { key: 'scopes', title: $t('tokenAPI.scopes') },
        { key: 'created', title: $t('tokenAPI.colCreated') },
        { key: 'last_used', title: $t('tokenAPI.colLastUsed') },
        { key: 'expiry_date', title: $t('tokenAPI.colExpires') },
        {
          key: 'revoked',
          align: 'end',
          title: $t('tokenAPI.colStatus'),
          sortable: false
        }
      ]"
    >
      <template #item.scopes="{ value }">
        {{ value.join(' ') }}
      </template>
      <template #item.revoked="{ value, item }">
        <v-chip
          v-if="value"
          prepend-icon="mdi-cancel"
          :text="$t('tokenAPI.revoked')"
        />
        <QueryDialog
          v-else
          color="warning"
          :text="$t('tokenAPI.revokeConfirm')"
          @confirmed="revokeKey(item.prefix)"
        >
          <template #activator="{ props }">
            <v-btn
              color="warning"
              prepend-icon="mdi-key-remove"
              size="small"
              :text="$t('tokenAPI.revokeBtn')"
              v-bind="props"
            />
          </template>
        </QueryDialog>
      </template>
    </v-data-table>
  </div>
</template>
