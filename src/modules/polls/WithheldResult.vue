<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'

import usePoll from './usePoll'
import { pollType } from './contentTypes'
import { PollTransition } from './types'

const props = defineProps<{
  pollId: number
}>()

const { t } = useI18n()
const { resultComponent, poll } = usePoll(computed(() => props.pollId))

function publishNow() {
  if (!poll.value) return
  pollType.transitions.make(poll.value, PollTransition.PublishResult, t)
}

const showResult = ref(false)
</script>

<template>
  <v-alert v-if="!poll"></v-alert>
  <v-alert v-else type="info" :title="$t('poll.result.withheld')">
    <p class="mt-2">
      {{ $t('poll.result.withheldExplanation') }}
    </p>
    <div v-if="poll.result" class="mt-4">
      <DefaultDialog
        :title="$t('poll.result.show')"
        @close="showResult = false"
      >
        <template #activator="{ props }">
          <v-btn color="warning" v-bind="props" prepend-icon="mdi-eye">
            {{ $t('poll.result.show') }}
          </v-btn>
        </template>
        <div v-if="poll && showResult">
          <component
            :is="resultComponent"
            :abstain-count="poll.abstain_count"
            :proposals="poll.proposals"
            :result="poll.result"
            class="mb-6"
          />
          <QueryDialog
            @confirmed="publishNow"
            :text="$t('poll.result.withheldPublishConfirm')"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="primary"
                block
                prepend-icon="mdi-check"
              >
                {{ $t('poll.result.withheldPublish') }}
              </v-btn>
            </template>
          </QueryDialog>
        </div>
        <div v-else>
          <p class="mb-6">
            {{ $t('poll.result.withheldDisplayWarning') }}
          </p>
          <p class="text-center">
            <v-btn color="warning" @click="showResult = true">
              {{ $t('poll.result.withheldDisplayConfirm') }}
            </v-btn>
          </p>
        </div>
      </DefaultDialog>
    </div>
  </v-alert>
</template>
