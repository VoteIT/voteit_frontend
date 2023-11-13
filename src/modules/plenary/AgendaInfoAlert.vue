<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import { AgendaState } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import { agendaItemType } from '../agendas/contentTypes'
import { anyPoll } from '../polls/usePolls'
import { PollState } from '../polls/types'
import useUserDetails from '../organisations/useUserDetails'
import usePlenary from './usePlenary'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const { meetingId } = useMeeting()
const { getUser } = useUserDetails()
const { agendaId, nextAgendaItem } = useAgenda(meetingId)
const { agendaItem, hasUnresolvedProposals } = useAgendaItem(agendaId)
const {
  hasBroadcast,
  isBroadcasting,
  meetingRoom,
  setAgendaId,
  setBroadcast,
  setHandler
} = useRoom()
const { selectedProposalIds } = usePlenary(meetingId, agendaId)

const isBroadcastingAI = computed(
  () =>
    isBroadcasting.value && meetingRoom.value?.agenda_item === agendaId.value
)

const hasOngoingPolls = computed(() =>
  anyPoll(
    (p) => p.agenda_item === agendaId.value && p.state === PollState.Ongoing
  )
)

// eslint-disable-next-line vue/return-in-computed-property
const alertInfo = computed(() => {
  if (!isBroadcasting.value)
    return hasBroadcast.value && meetingRoom.value?.handler
      ? {
          props: {
            icon: 'mdi-broadcast',
            title: t('room.broadcastingUser', {
              ...getUser(meetingRoom.value.handler)
            }),
            text: t('plenary.noBroadcastDescription'),
            type: 'warning' as const
          },
          actions: [
            {
              prependIcon: 'mdi-broadcast',
              text: t('plenary.takeOverBroadcast'),
              async onClick() {
                if (
                  !(await dialogQuery({
                    title: t('room.confirmBroadcastTakeover'),
                    theme: ThemeColor.Warning
                  }))
                )
                  return
                await setHandler()
                await setBroadcast({
                  agenda_item: agendaId.value,
                  highlighted: [...selectedProposalIds]
                })
              }
            }
          ]
        }
      : {
          props: {
            icon: 'mdi-broadcast-off',
            title: t('room.noBroadcast'),
            text: t('plenary.noBroadcastDescription'),
            type: 'info' as const
          },
          actions: [
            {
              prependIcon: 'mdi-broadcast',
              text: t('plenary.startBroadcast'),
              onClick() {
                setBroadcast({
                  agenda_item: agendaId.value,
                  highlighted: [...selectedProposalIds]
                })
              }
            }
          ]
        }
  switch (agendaItem.value?.state) {
    case AgendaState.Private:
      return {
        props: {
          title: t('plenary.privateAI'),
          text: t('plenary.privateAIDescription'),
          type: 'warning' as const
        }
      }
    case AgendaState.Upcoming:
      if (isBroadcastingAI.value) return
      return {
        props: {
          icon: 'mdi-broadcast',
          title: t('plenary.upcomingAI'),
          text: t('plenary.upcomingAIDescription'),
          type: 'info' as const
        },
        actions: [
          {
            prependIcon: 'mdi-gavel',
            text: t('plenary.toDecisionMode'),
            async onClick() {
              await agendaItemType.api.transition(agendaId.value, 'ongoing')
              await setAgendaId(agendaId.value)
            }
          },
          {
            prependIcon: 'mdi-broadcast',
            text: t('plenary.broadcastAI'),
            onClick() {
              setAgendaId(agendaId.value)
            }
          }
        ]
      }
    case AgendaState.Ongoing:
      if (
        isBroadcastingAI.value &&
        !hasUnresolvedProposals.value &&
        !hasOngoingPolls.value &&
        nextAgendaItem.value
      )
        return {
          props: {
            icon: 'mdi-gavel',
            title: t('plenary.closeAI'),
            text: t('plenary.closeAIDescription'),
            type: 'info' as const
          },
          actions: [
            {
              prependIcon: 'mdi-gavel',
              text: t('plenary.closeAI'),
              async onClick() {
                await agendaItemType.api.transition(agendaId.value, 'close')
                if (!nextAgendaItem.value) return
                await router.push({
                  name: route.name!,
                  params: { ...route.params, aid: nextAgendaItem.value.pk }
                })
              }
            }
          ]
        }
      if (isBroadcastingAI.value) return
      return {
        props: {
          icon: 'mdi-broadcast',
          title: t('plenary.ongoingAI'),
          text: t('plenary.ongoingAIDescription'),
          type: 'info' as const
        },
        actions: [
          {
            prependIcon: 'mdi-broadcast',
            text: t('plenary.broadcastAI'),
            onClick() {
              setAgendaId(agendaId.value)
            }
          }
        ]
      }
  }
})
</script>

<template>
  <v-alert
    v-if="alertInfo"
    v-bind="alertInfo.props"
    :border="true"
    class="pa-6"
  >
    <template #append v-if="alertInfo.actions">
      <v-btn
        v-for="action in alertInfo.actions"
        :key="action.text"
        v-bind="action"
        block
        class="my-1"
      />
    </template>
  </v-alert>
</template>
