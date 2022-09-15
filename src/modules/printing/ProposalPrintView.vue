<template>
  <v-row>
    <v-col v-bind="cols.default">
      <v-sheet class="d-print-none pa-4 mb-8" border rounded>
        <div class="d-flex">
          <h2>
            Select proposals
          </h2>
          <v-fade-transition>
            <v-btn
              v-show="!allSelected"
              color="primary"
              prepend-icon="mdi-check-all"
              class="mx-4"
              size="small"
              @click="allSelected = true"
            >
              Select all
            </v-btn>
          </v-fade-transition>
          <v-spacer />
          <v-btn
            color="primary"
            icon="mdi-printer"
            :disabled="!selectedProposals.length"
            @click="print()"
          />
        </div>
        <v-chip-group v-model="propIds" multiple column>
          <v-chip v-for="{ pk, prop_id } in proposals" :key="pk" :value="pk" color="primary">
            #{{ prop_id }}
          </v-chip>
        </v-chip-group>
      </v-sheet>
      <v-alert type="info" class="my-8 d-print-none">
        Proposals will be printed one per page. Use the printing dialog in your browser to disable page headers and footers.
      </v-alert>
      <div v-for="{ pk, author, meetingGroup, body, body_diff, created, prop_id } in selectedProposals" :key="pk" class="proposal-container mb-12">
        <p class="mb-2 text-h4">
          #{{ prop_id }}
        </p>
        <p class="text-secondary">
          <span v-if="meetingGroup">
            {{ meetingGroup.title }}
          </span>
          <User v-else :pk="author" userid />
          - {{ created.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }}
        </p>
        <div v-html="body_diff || body" class="text-h4 proposal-text-paragraph my-2" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals from '../proposals/useProposals'

export default defineComponent({
  inject: ['cols'],
  setup () {
    const { meetingId } = useMeeting()
    const { getMeetingGroup } = useMeetingGroups(meetingId)
    const agendaId = computed(() => Number(route.params.aid))
    const { getAgendaProposals } = useProposals()
    useMeetingTitle('Printing') // TODO
    const route = useRoute()
    const router = useRouter()
    const propIds = computed<number[]>({
      get () {
        if (typeof route.params.propIds !== 'string') return []
        return route.params.propIds
          .split(',')
          .map(Number)
      },
      set (value) {
        router.replace(value.join(','))
      }
    })
    const proposals = computed(() => getAgendaProposals(agendaId.value))
    const selectedProposals = computed(() => {
      return getAgendaProposals(
        agendaId.value,
        ({ pk }) => propIds.value.includes(pk)
      ).map(p => ({
        meetingGroup: p.meeting_group && getMeetingGroup(p.meeting_group),
        ...p
      }))
    })

    const allSelected = computed({
      get () {
        return propIds.value.length === proposals.value.length
      },
      set (value) {
        if (value) propIds.value = proposals.value.map(p => p.pk)
      }
    })

    function print () {
      if (selectedProposals.value.length) window.print()
    }
    onMounted(print)

    return {
      allSelected,
      propIds,
      proposals,
      selectedProposals,
      print
    }
  }
})
</script>

<style lang="sass" scoped>
.proposal-container
  break-after: always
</style>
