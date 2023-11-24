<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import { AgendaState, AgendaTransition } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import { agendaItemType } from '../agendas/contentTypes'
import useUserDetails from '../organisations/useUserDetails'
import { MeetingState } from '../meetings/types'
import { meetingType } from '../meetings/contentTypes'
import { filterProposals } from '../proposals/useProposals'
import { ProposalState } from '../proposals/types'

import usePlenary from './usePlenary'

const { t } = useI18n()

const { meeting, meetingId } = useMeeting()
const { getUser } = useUserDetails()
const { agendaId } = useAgenda(meetingId)
const { agendaItem, hasOngoingPolls, hasUnresolvedProposals } =
  useAgendaItem(agendaId)
const {
  hasBroadcast,
  highlighted,
  isBroadcasting,
  meetingRoom,
  setBroadcast,
  setHandler
} = useRoom()
const { selectedProposalIds } = usePlenary(meetingId, agendaId)

const isBroadcastingAI = computed(
  () =>
    isBroadcasting.value && meetingRoom.value?.agenda_item === agendaId.value
)

function getMeetingStateAlert() {
  switch (meeting.value?.state) {
    case undefined:
    case MeetingState.Ongoing:
      return
    case MeetingState.Upcoming:
      return {
        props: {
          icon: 'mdi-progress-clock',
          title: t('plenary.meetingUpcoming'),
          text: t('plenary.meetingUpcomingDescription'),
          type: 'warning' as const
        },
        actions: [
          {
            prependIcon: 'mdi-play-circle',
            text: t('plenary.meetingToOngoing'),
            async onClick() {
              meetingType.transitions.make(meetingId.value, 'ongoing')
            }
          }
        ]
      }
    default:
      return {
        props: {
          icon: 'mdi-progress-clock',
          title: t('plenary.meetingClosed'),
          text: t('plenary.meetingClosedDescription'),
          type: 'warning' as const
        }
      }
  }
}

function broadcastThis() {
  return setBroadcast({
    agenda_item: agendaId.value,
    highlighted: [...selectedProposalIds.value]
  })
}

const selectApprovedAction = computed(() => {
  const proposals = filterProposals(
    (p) =>
      p.agenda_item === agendaId.value && p.state === ProposalState.Approved,
    'modified'
  ).map((p) => p.pk)
  if (
    !isBroadcasting.value ||
    hasUnresolvedProposals.value ||
    !proposals.length ||
    isEqual(proposals, highlighted.value)
  )
    return []
  return [
    {
      prependIcon: 'mdi-check-circle-outline',
      text: t('plenary.displayApprovedProposals', proposals.length),
      onClick() {
        return setBroadcast({ highlighted: proposals })
      }
    }
  ]
})

function getAgendaAlert() {
  if (!isBroadcasting.value && agendaItem.value?.state !== AgendaState.Private)
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
                await broadcastThis()
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
              onClick: broadcastThis
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
              await agendaItemType.transitions.make(
                agendaId.value,
                AgendaTransition.Ongoing
              )
              await broadcastThis()
            }
          },
          {
            prependIcon: 'mdi-broadcast',
            text: t('plenary.broadcastAI'),
            onClick: broadcastThis
          }
        ]
      }
    case AgendaState.Ongoing:
      if (
        isBroadcastingAI.value &&
        !hasUnresolvedProposals.value &&
        !hasOngoingPolls.value
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
                await agendaItemType.transitions.make(
                  agendaId.value,
                  AgendaTransition.Close
                )
              }
            },
            ...selectApprovedAction.value
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
            onClick: broadcastThis
          }
        ]
      }
    case AgendaState.Closed:
      return {
        props: {
          icon: 'mdi-check-all',
          title: t('plenary.closedAI'),
          text: t('plenary.closedAIDescription'),
          type: 'warning' as const
        },
        actions: selectApprovedAction.value
      }
  }
}

const alertInfo = computed(() => getMeetingStateAlert() || getAgendaAlert())
</script>

<template>
  <v-alert
    v-if="alertInfo"
    v-bind="alertInfo.props"
    :border="true"
    class="pa-6"
  >
    <template #append v-if="alertInfo.actions">
      <!-- TODO Use WorkflowTransition to trigger transition guards -->
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
