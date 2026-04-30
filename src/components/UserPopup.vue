<script setup lang="ts">
import { computed, provide } from 'vue'

import { getFullName, slugify } from '@/utils'
import useAgendaStore from '@/modules/agendas/useAgendaStore'
import useMeetingId from '@/modules/meetings/useMeetingId'
import { TagClickHandlerKey } from '@/modules/meetings/useTags'
import useGroupStore from '@/modules/meetings/useGroupStore'
import { IUser } from '@/modules/organisations/types'
import useProposalStore from '@/modules/proposals/useProposalStore'

import UserAvatar from './UserAvatar.vue'
import Tag from './Tag.vue'

provide(TagClickHandlerKey, undefined)

const props = defineProps<{
  user: IUser
}>()

const { filterProposals } = useProposalStore()
const { getAgendaItems } = useAgendaStore()
const meetingId = useMeetingId()
const { getGroupRole, getUserGroups } = useGroupStore()

const userGroups = computed(() =>
  getUserGroups(meetingId.value).map((g) => {
    const role = g.memberships.find((m) => m.user === props.user.pk)?.role
    return {
      ...g,
      roleName: role ? getGroupRole(role)?.title : undefined
    }
  })
)

const proposals = computed(() =>
  filterProposals((p) => p.m === meetingId.value && p.author === props.user.pk)
)

const proposalAgendaItems = computed(() =>
  getAgendaItems((a) =>
    proposals.value.some((p) => p.agenda_item === a.pk)
  ).map((a) => ({
    ...a,
    proposalIds: proposals.value
      .filter((p) => p.agenda_item === a.pk)
      .map((p) => p.prop_id)
  }))
)
</script>

<template>
  <v-menu scroll-strategy="close" location="top center">
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <v-card
      class="mb-1"
      elevation="4"
      rounded="lg"
      :subtitle="user.userid ?? undefined"
      :title="getFullName(user)"
      width="300"
    >
      <template #prepend>
        <UserAvatar :user="user" size="large" class="mt-1" />
      </template>
      <v-list
        v-if="proposalAgendaItems.length || userGroups.length"
        density="compact"
      >
        <v-list-subheader
          v-if="userGroups.length"
          :title="$t('meeting.groups.count', userGroups.length)"
        />
        <v-list-item
          v-for="group in userGroups"
          prepend-icon="mdi-account-group"
          :key="group.pk"
          :subtitle="group.roleName"
          :title="group.title"
        />
        <v-list-subheader
          :title="$t('proposal.countInMeeting', proposals.length)"
        />
        <v-list-item
          v-for="{ pk, proposalIds, title } in proposalAgendaItems"
          :key="pk"
          :title="title"
          :to="{
            name: 'agendaItem',
            params: { aid: pk, aslug: slugify(title) }
          }"
        >
          <template #subtitle>
            <div class="d-flex ga-1">
              <Tag v-for="prop in proposalIds" :key="prop" :name="prop" />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
