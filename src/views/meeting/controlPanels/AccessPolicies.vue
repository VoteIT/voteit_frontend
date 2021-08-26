<template>
  <div>
    <h2>{{ title }}</h2>
    <v-row>
      <v-col>
        <v-card v-for="p in policies" :key="p.pk">
          <v-card-title>
            {{ p.name }}
          </v-card-title>
          <v-card-subtitle>
          </v-card-subtitle>
          <v-list>
            <v-list-subheader>
              Roles given
            </v-list-subheader>
            <v-list-item v-for="r in p.roles_given" :key="r">
              {{ r }}
            </v-list-item>
          </v-list>
          <v-card-actions>
            <v-btn variant="text" color="primary" prepend-icon="mdi-pencil" @click="alert('*Not implemented (missing API)')">{{ t('edit') }}</v-btn>
            <v-btn variant="text" color="warning" prepend-icon="mdi-delete" @click="alert('*Not implemented (missing API)')">{{ t('delete') }}</v-btn>
            <Switch v-model="p.active" readonly :loading="modifying.has(p.pk)" @change="setActive(p, $event)" />
            <span class="ml-1">{{ p.active ? t('active') : t('inactive') }}</span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onBeforeMount, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import accessPolicyType from '@/contentTypes/accessPolicy'
import { AccessPolicy } from '@/contentTypes/types'
import useMeeting from '@/composables/meeting/useMeeting'
import useAlert from '@/composables/useAlert'

export default defineComponent({
  name: 'AccessPolicies',
  path: 'aps',
  icon: 'mdi-key',
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { alert } = useAlert()
    const api = accessPolicyType.getContentApi()
    const policies = ref<AccessPolicy[]>([])
    const modifying = reactive<Set<number>>(new Set())

    onBeforeMount(async () => {
      const { data } = await api.retrieve(meetingId.value)
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
      alert,
      modifying,
      policies,
      setActive,
      title: computed(() => t('accessPolicy.settings'))
    }
  }
})
</script>
