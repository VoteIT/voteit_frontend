<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import useErrorHandler from '@/composables/useErrorHandler'

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

interface IAlertInfo {
  actions?: {
    prependIcon: string
    text: string
    onClick?(): void
  }[]
  props: {
    icon?: string
    title: string
    text: string
    type: 'warning' | 'info'
  }
}

const { t } = useI18n()

const { meeting } = useMeeting()
const { getUser } = useUserDetails()
const { agendaId, agendaItem, hasOngoingPolls, hasUnresolvedProposals } =
  useAgendaItem()
const {
  hasBroadcast,
  highlighted,
  isBroadcasting,
  meetingRoom,
  setBroadcast,
  setHandler
} = useRoom()
const { selectedProposalIds, selectProposalIds } = usePlenary(agendaId)
const { handleRestError } = useErrorHandler({ target: 'dialog' })

const isBroadcastingAI = computed(
  () =>
    isBroadcasting.value && meetingRoom.value?.agenda_item === agendaId.value
)

function getMeetingStateAlert(): IAlertInfo | undefined {
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
          type: 'warning'
        },
        actions: [
          {
            prependIcon: 'mdi-play-circle',
            text: t('plenary.meetingToOngoing'),
            async onClick() {
              try {
                await meetingType.transitions.make(meeting.value!, 'ongoing', t)
              } catch (e) {
                handleRestError(e, 'transition')
              }
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
          type: 'warning'
        }
      }
  }
}

function broadcastThis() {
  // This does not need to call selectProposalIds(), because it uses selected ids already
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
      async onClick() {
        try {
          await setBroadcast({
            agenda_item: agendaId.value,
            highlighted: proposals
          })
          selectProposalIds(proposals)
        } catch (e) {
          handleRestError(e, 'highlighted')
        }
      }
    }
  ]
})

function getAgendaAlert(): IAlertInfo | undefined {
  if (!isBroadcasting.value && agendaItem.value?.state !== AgendaState.Private)
    return hasBroadcast.value && meetingRoom.value?.handler
      ? {
          props: {
            icon: 'mdi-broadcast',
            title: t('room.broadcastingUser', {
              ...getUser(meetingRoom.value.handler)
            }),
            text: t('plenary.noBroadcastDescription'),
            type: 'warning'
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
                try {
                  await setHandler()
                  await broadcastThis()
                } catch (e) {
                  handleRestError(e)
                }
              }
            }
          ]
        }
      : {
          props: {
            icon: 'mdi-broadcast-off',
            title: t('room.noBroadcast'),
            text: t('plenary.noBroadcastDescription'),
            type: 'info'
          },
          actions: [
            {
              prependIcon: 'mdi-broadcast',
              text: t('plenary.startBroadcast'),
              async onClick() {
                try {
                  await broadcastThis()
                } catch (e) {
                  handleRestError(e)
                }
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
          type: 'warning'
        }
      }
    case AgendaState.Upcoming:
      if (isBroadcastingAI.value) return
      return {
        props: {
          icon: 'mdi-broadcast',
          title: t('plenary.upcomingAI'),
          text: t('plenary.upcomingAIDescription'),
          type: 'info'
        },
        actions: [
          {
            prependIcon: 'mdi-gavel',
            text: t('plenary.toDecisionMode'),
            async onClick() {
              try {
                await agendaItemType.transitions.make(
                  agendaItem.value!,
                  AgendaTransition.Ongoing,
                  t
                )
                await broadcastThis()
              } catch (e) {
                handleRestError(e)
              }
            }
          },
          {
            prependIcon: 'mdi-broadcast',
            text: t('plenary.broadcastAI'),
            async onClick() {
              try {
                await broadcastThis()
              } catch (e) {
                handleRestError(e)
              }
            }
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
            type: 'info'
          },
          actions: [
            {
              prependIcon: 'mdi-gavel',
              text: t('plenary.closeAI'),
              async onClick() {
                await agendaItemType.transitions.make(
                  agendaItem.value!,
                  AgendaTransition.Close,
                  t
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
          type: 'info'
        },
        actions: [
          {
            prependIcon: 'mdi-broadcast',
            text: t('plenary.broadcastAI'),
            async onClick() {
              try {
                await broadcastThis()
              } catch (e) {
                handleRestError(e)
              }
            }
          }
        ]
      }
    case AgendaState.Closed:
      return {
        props: {
          icon: 'mdi-check-all',
          title: t('plenary.closedAI'),
          text: t('plenary.closedAIDescription'),
          type: 'warning'
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
      <v-btn
        v-for="props in alertInfo.actions"
        :key="props.text"
        v-bind="props"
        block
        class="my-1"
      />
    </template>
  </v-alert>
</template>
