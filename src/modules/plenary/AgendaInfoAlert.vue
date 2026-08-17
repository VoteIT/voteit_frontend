<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import useErrorHandler from '@/composables/useErrorHandler'

import useAgendaItem from '../agendas/useAgendaItem'
import { AgendaState } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useRoom from '../rooms/useRoom'
import { agendaItemType } from '../agendas/contentTypes'
import useUserDetails from '../organisations/useUserDetails'
import { MeetingState } from '../meetings/types'
import { meetingType } from '../meetings/contentTypes'
import useProposalStore from '../proposals/useProposalStore'
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

const { meeting, meetingId } = useMeeting()
const { getUser } = useUserDetails(meetingId)
const { getAiProposals } = useProposalStore()
const { agendaId, agendaItem, hasOngoingPolls, hasUnresolvedProposals } =
  useAgendaItem()
const {
  hasBroadcast,
  highlighted,
  isBroadcaster,
  isBroadcasting,
  meetingRoom,
  handleBroadcast
} = useRoom()
const { isBroadcastingAI, selectedProposalIds, selectProposalIds } =
  usePlenary(agendaId)
const { handled, handler } = useErrorHandler({ target: 'dialog' })

/**
 * Broadcast this agenda item, with errors reported to the user.
 */
const broadcast = handler(broadcastThis)

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
            onClick: handler(
              () => meetingType.sm.sendEvent(meeting.value!, 'make_ongoing', t),
              'transition'
            )
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

function getUpcomingAlert(): IAlertInfo | undefined {
  const actions = isBroadcastingAI.value
    ? [
        {
          prependIcon: 'mdi-gavel',
          text: t('plenary.toDecisionMode'),
          onClick: handler(() =>
            agendaItemType.sm.sendEvent(agendaItem.value!, 'make_ongoing', t)
          )
        }
      ]
    : [
        {
          prependIcon: 'mdi-gavel',
          text: t('plenary.toDecisionMode'),
          onClick: handler(async () => {
            await agendaItemType.sm.sendEvent(
              agendaItem.value!,
              'make_ongoing',
              t
            )
            await broadcastThis()
          })
        },
        {
          prependIcon: 'mdi-broadcast',
          text: t('plenary.broadcastAI'),
          onClick: broadcast
        }
      ]
  return {
    props: {
      icon: 'mdi-broadcast',
      title: t('plenary.upcomingAI'),
      text: t('plenary.upcomingAIDescription'),
      type: 'info'
    },
    actions
  }
}

function broadcastThis() {
  // This does not need to call selectProposalIds(), because it uses selected ids already
  return handleBroadcast({
    agenda_item: agendaId.value,
    highlighted: [...selectedProposalIds.value],
    send_proposals: true
  })
}

const selectApprovedAction = computed(() => {
  const proposals = getAiProposals(
    agendaId.value,
    (p) => p.state === ProposalState.Approved,
    (p) => p.modified
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
        await handled(async () => {
          await handleBroadcast({
            agenda_item: agendaId.value,
            highlighted: proposals
          })
          selectProposalIds(proposals)
        }, 'highlighted')
      }
    }
  ]
})

function getAgendaAlert(): IAlertInfo | undefined {
  if (!isBroadcasting.value && agendaItem.value?.state !== AgendaState.Private)
    if (hasBroadcast.value && meetingRoom.value?.handler)
      // There is a broadcast, but we're controlling it
      return isBroadcaster.value
        ? {
            props: {
              icon: 'mdi-broadcast',
              title: t('room.broadcastingSelf'),
              text: t('room.broadcastingSelfDescription'),
              type: 'warning'
            },
            actions: [
              {
                prependIcon: 'mdi-broadcast',
                text: t('room.broadcastHere'),
                onClick: broadcast
              }
            ]
          }
        : {
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
                  await handled(broadcastThis)
                }
              }
            ]
          }
    // Else there is no broadcast.
    else
      return {
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
            onClick: broadcast
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
      return getUpcomingAlert()
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
              onClick: handler(
                () =>
                  agendaItemType.sm.sendEvent(agendaItem.value!, 'close', t),
                'transition'
              )
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
            onClick: broadcast
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
