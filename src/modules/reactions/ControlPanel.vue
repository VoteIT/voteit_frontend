<script lang="ts" setup>
import { enumerate } from 'itertools'
import { computed, reactive } from 'vue'
import Draggable from 'vuedraggable'

import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import UserList from '@/components/UserList.vue'
import useAuthentication from '@/composables/useAuthentication'
import HelpSection from '@/components/HelpSection.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useMeetingId from '../meetings/useMeetingId'

import useReactions from './useReactions'
import ReactionEditModal from './ReactionEditModal.vue'
import FlagButtonEditModal from './FlagButtonEditModal.vue'
import { canAddReactionButton } from './rules'
import { ReactionButton, isFlagButton } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'
import FlagButton from './FlagButton.vue'

const { user } = useAuthentication()
const meetingId = useMeetingId()
const reactions = useReactions()

const meetingButtons = computed({
  get() {
    return reactions.getMeetingButtons(meetingId.value)
  },
  set(btns) {
    for (const [order, btn] of enumerate(btns, 1)) {
      if (btn.order === order) continue
      reactionButtonType.api.patch(btn.pk, { order })
    }
  }
})

const canEditButtons = computed(() => canAddReactionButton(meetingId.value))

async function deleteButton(button: ReactionButton) {
  try {
    await reactionButtonType.api.delete(button.pk)
  } catch (err) {
    console.error(err)
  }
}

async function setContentType(
  button: ReactionButton,
  contentType: string,
  value: boolean
) {
  // eslint-disable-next-line camelcase
  const allowed_models = value
    ? [contentType, ...button.allowed_models]
    : button.allowed_models.filter((ct) => ct !== contentType)
  // eslint-disable-next-line camelcase
  await reactionButtonType.api.patch(button.pk, { allowed_models })
}

async function setActive(button: ReactionButton, active: boolean) {
  await reactionButtonType.api.patch(button.pk, { active })
}

const model = reactive<Record<number, boolean>>({})
</script>

<template>
  <div>
    <HelpSection id="reactionControls" start-open class="mb-4">
      <h2 class="mb-2">
        {{ $t('reaction.help.title') }}
      </h2>
      <p class="mb-2">
        <strong>
          {{ $t('reaction.help.description') }}
        </strong>
      </p>
      <div class="d-flex">
        <v-icon icon="mdi-gesture-tap-button" class="mr-3 mt-1" />
        <p class="mb-2">
          {{ $t('reaction.help.reactionButton') }}
        </p>
      </div>
      <div class="d-flex">
        <v-icon icon="mdi-flag" class="mr-3 mt-1" />
        <p class="mb-2">
          {{ $t('reaction.help.flagButton') }}
        </p>
      </div>
    </HelpSection>
    <div class="d-flex mb-4">
      <h2>{{ $t('reaction.settings') }}</h2>
      <v-spacer />
      <v-menu v-if="canEditButtons">
        <v-list>
          <DefaultDialog :title="$t('reaction.addButton')">
            <template #activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-gesture-tap-button">
                {{ $t('reaction.button') }}
              </v-list-item>
            </template>
            <template #default="{ close }">
              <ReactionEditModal @close="close" />
            </template>
          </DefaultDialog>
          <DefaultDialog :title="$t('reaction.addButton')">
            <template #activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-flag">
                {{ $t('reaction.flags') }}
              </v-list-item>
            </template>
            <template #default="{ close }">
              <FlagButtonEditModal @close="close" />
            </template>
          </DefaultDialog>
        </v-list>
        <template #activator="{ props }">
          <v-btn v-bind="props" append-icon="mdi-chevron-down" color="primary">
            {{ $t('reaction.addButton') }}
          </v-btn>
        </template>
      </v-menu>
    </div>
    <v-table>
      <thead>
        <tr>
          <th>
            {{ $t('reaction.buttons') }}
          </th>
          <th>
            {{ $t('reaction.active') }}
          </th>
          <th>
            {{ $t('proposal.proposals') }}
          </th>
          <th>
            {{ $t('discussion.discussions') }}
          </th>
          <th v-if="canEditButtons"></th>
        </tr>
      </thead>
      <draggable
        v-model="meetingButtons"
        handle=".handle"
        item-key="pk"
        tag="tbody"
      >
        <template #item="{ element: button }">
          <tr>
            <td class="text-no-wrap">
              <v-icon icon="mdi-drag" class="handle ml-n3 mr-2" />
              <FlagButton
                v-if="isFlagButton(button)"
                :button="button"
                :can-toggle="true"
                v-model="model[button.pk]"
              />
              <RealReactionButton
                v-else
                :button="button"
                :count="Number(!!model[button.pk])"
                :disabled="!button.active"
                v-model="model[button.pk]"
              >
                <template #userList>
                  <UserList v-if="user" :userIds="[user.pk]" />
                </template>
              </RealReactionButton>
            </td>
            <td>
              <v-switch
                hide-details
                color="primary"
                :modelValue="button.active"
                @update:modelValue="setActive(button, $event!)"
              />
            </td>
            <td
              v-for="contentType in ['proposal', 'discussion_post']"
              :key="contentType"
            >
              <v-switch
                hide-details
                color="primary"
                :modelValue="button.allowed_models.includes(contentType)"
                @update:modelValue="
                  setContentType(button, contentType, $event!)
                "
              />
            </td>
            <td class="text-right" v-if="canEditButtons">
              <DefaultDialog :title="$t('reaction.editButton')">
                <template #activator="{ props }">
                  <ButtonWithDropdown
                    prepend-icon="mdi-pencil"
                    color="primary"
                    size="small"
                    :text="$t('edit')"
                    v-bind="props"
                  >
                    <v-list>
                      <QueryDialog
                        color="warning"
                        :text="$t(('reaction.deleteButtonConfirmation')"
                        @confirmed="deleteButton(button)"
                      >
                        <template #activator="{ props }">
                          <v-list-item
                            prepend-icon="mdi-delete"
                            base-color="warning"
                            v-bind="props"
                            size="small"
                            :title="$t('content.delete')"
                          />
                        </template>
                      </QueryDialog>
                    </v-list>
                  </ButtonWithDropdown>
                </template>
                <template #default="{ close }">
                  <FlagButtonEditModal
                    v-if="isFlagButton(button)"
                    :data="button"
                    @close="close"
                  />
                  <ReactionEditModal v-else :data="button" @close="close" />
                </template>
              </DefaultDialog>
            </td>
          </tr>
        </template>
      </draggable>
    </v-table>
  </div>
</template>

<style scoped lang="sass">
.handle
    cursor: grab
</style>
