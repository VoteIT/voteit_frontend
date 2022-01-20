<template>
  <div>
    <h2>{{ t('accessPolicy.settings') }}</h2>
    <v-row>
      <v-col>
        <v-card v-for="p in policies" :key="p.pk" :title="p.name">
          <v-card-text>
            <h2 class="text-h6 mb-2">
              {{ t('accessPolicy.rolesGiven') }}
            </h2>
            <div>
              <v-chip v-for="r in p.roles_given" :key="r">
                {{ r }}
              </v-chip>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" prepend-icon="mdi-pencil" @click="alert('*Not implemented (missing API)')">{{ t('edit') }}</v-btn>
            <v-btn variant="text" color="warning" prepend-icon="mdi-delete" @click="alert('*Not implemented (missing API)')">{{ t('delete') }}</v-btn>
            <v-switch :modelValue="p.active" @update:modelValue="setActive(p, $event)" />
            <span class="ml-1">{{ p.active ? t('active') : t('inactive') }}</span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onBeforeMount, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { AccessPolicy } from '@/contentTypes/types'
import useMeeting from '@/modules/meetings/useMeeting'
import useAlert from '@/composables/useAlert'
import { accessPolicyType } from '../contentTypes'

export default defineComponent({
  translationKey: 'accessPolicy.plural',
  path: 'aps',
  icon: 'mdi-key',
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { alert } = useAlert()
    const policies = ref<AccessPolicy[]>([])
    const modifying = reactive<Set<number>>(new Set())

    onBeforeMount(async () => {
      const { data } = await accessPolicyType.api.retrieve(meetingId.value)
      policies.value = data.policies
    })

    function setActive (p: AccessPolicy /* value: boolean */) {
      modifying.add(p.pk)
      setTimeout(() => {
        modifying.delete(p.pk)
        // for (const ep of policies.value) {
        //   if (ep.pk === p.pk) ep.active = value
        // }
        alert('*Not implemented (missing API)')
      }, 150)
    }

    return {
      t,
      modifying,
      policies,
      alert,
      setActive
    }
  }
})
</script>
